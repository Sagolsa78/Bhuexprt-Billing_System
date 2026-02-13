import cv2
import numpy as np
import re
import json
import os
import sys
import logging
from sklearn.cluster import KMeans

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Try importing PaddleOCR, fallback to Tesseract if fails
try:
    from paddleocr import PaddleOCR
    USE_PADDLE = True
    # Initialize PaddleOCR (downloads model on first run)
    # use_angle_cls=True enables orientation classification
    ocr_engine = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
    logging.info("PaddleOCR initialized successfully.")
except ImportError:
    import pytesseract
    USE_PADDLE = False
    logging.warning("PaddleOCR not found. Falling back to Tesseract.")

def deskew_image(image):
    """
    Corrects the skew of the image using Hough Lines or minAreaRect.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    coords = np.column_stack(np.where(gray > 0))
    angle = cv2.minAreaRect(coords)[-1]
    
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
        
    # Rotate the image to deskew it
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    logging.info(f"Deskewed image by {angle:.2f} degrees.")
    return rotated

def preprocess_image(image_path):
    """
    Reads and preprocesses the image: deskewing, thresholding, morphological ops.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image file: {image_path}")
        
    # 1. Deskew
    img = deskew_image(img)
    
    # 2. Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 3. Adaptive Thresholding (better for shadows/lighting)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    return img, gray, thresh

def detect_table_structure(thresh_img):
    """
    Detects horizontal and vertical lines to identify table structure.
    Returns: horizontal_lines_mask, vertical_lines_mask, combined_table_mask
    """
    # Define kernels
    h_kernel_len = np.array(thresh_img).shape[1] // 50
    v_kernel_len = np.array(thresh_img).shape[0] // 50
    
    # Detect horizontal lines
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_kernel_len, 1))
    temp1 = cv2.erode(thresh_img, h_kernel, iterations=3)
    horizontal_lines = cv2.dilate(temp1, h_kernel, iterations=3)
    
    # Detect vertical lines
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_kernel_len))
    temp2 = cv2.erode(thresh_img, v_kernel, iterations=3)
    vertical_lines = cv2.dilate(temp2, v_kernel, iterations=3)
    
    # Combine
    table_mask = cv2.addWeighted(horizontal_lines, 0.5, vertical_lines, 0.5, 0.0)
    table_mask = cv2.threshold(table_mask, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    return horizontal_lines, vertical_lines, table_mask

def extract_text_paddle(img):
    """
    Uses PaddleOCR to extract text and bounding boxes.
    Returns list of [ [ [[x1,y1], [x2,y2], ...], (text, confidence) ], ... ]
    """
    result = ocr_engine.ocr(img, cls=True)
    if not result or result[0] is None:
        return ""
    
    # Normalize output format
    # Paddle returns a list of lines, where each line is a list of results.
    # We will flatten this.
    data = []
    
    # PaddleOCR result structure varies by version, usually result[0] is the page
    for line in result[0]:
        coords = line[0] # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        text, conf = line[1]
        
        # Calculate bounding box
        x_coords = [int(p[0]) for p in coords]
        y_coords = [int(p[1]) for p in coords]
        left = min(x_coords)
        top = min(y_coords)
        width = max(x_coords) - left
        height = max(y_coords) - top
        
        data.append({
            "text": text,
            "conf": conf * 100, # Convert to 0-100 scale
            "left": left,
            "top": top,
            "width": width,
            "height": height
        })
        
    return data

def extract_text_tesseract(img):
    """
    Fallback using Tesseract.
    """
    custom_config = r'--oem 3 --psm 6'
    data_dict = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT, config=custom_config)
    
    data = []
    n_boxes = len(data_dict['text'])
    for i in range(n_boxes):
        if int(data_dict['conf'][i]) < 0: 
            continue
        txt = data_dict['text'][i].strip()
        if not txt:
            continue
            
        data.append({
            "text": txt,
            "conf": float(data_dict['conf'][i]),
            "left": data_dict['left'][i],
            "top": data_dict['top'][i],
            "width": data_dict['width'][i],
            "height": data_dict['height'][i]
        })
    return data

def extract_header_info(data):
    """
    Extracts Invoice No, Date, etc from raw text blobs.
    """
    full_text = " ".join([d['text'] for d in data])
    
    header_info = {
        "invoice_number": None,
        "date": None,
        "due_date": None,
        "vendor_name": None,
        "customer_name": None
    }
    
    # Regex Patterns (Enhanced)
    patterns = {
        "invoice_number": [
            r"Invoice\s*No[:.]?\s*([A-Za-z0-9\-/]+)",
            r"Inv\s*No[:.]?\s*([A-Za-z0-9\-/]+)",
            r"Bill\s*No[:.]?\s*([A-Za-z0-9\-/]+)"
        ],
        "date": [
            r"Date[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            r"Dated[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"
        ],
        "due_date": [
            r"Due\s*Date[:.]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})"
        ]
    }
    
    for key, regex_list in patterns.items():
        for pat in regex_list:
            match = re.search(pat, full_text, re.IGNORECASE)
            if match:
                header_info[key] = match.group(1).strip()
                break
                
    # Simple Heuristic for Vendor (Top Left/Center usually)
    # Sort by 'top', then 'left'
    sorted_data = sorted(data, key=lambda x: (x['top'], x['left']))
    
    # Take first few lines as potential vendor
    # Heuristic: Largest font text at top might be vendor. 
    # For now, just taking the first non-keyword line
    ignore = ["invoice", "tax", "gst", "bill", "date", "original", "copy"]
    candidates = []
    for item in sorted_data[:10]:
        if item['top'] > sorted_data[-1]['top'] * 0.2: # Only look at top 20%
            break
        txt_lower = item['text'].lower()
        if not any(kw in txt_lower for kw in ignore) and len(txt_lower) > 3:
            candidates.append(item['text'])
            
    header_info["vendor_name"] = " ".join(candidates[:2]) if candidates else "Unknown Vendor"
    
    return header_info

def extract_financials(data):
    """
    Extracts Total, Tax, Subtotal using regex on the full text.
    """
    full_text = " ".join([d['text'] for d in data])
    financials = {"subtotal": 0.0, "tax": 0.0, "grand_total": 0.0}
    
    amount_re = r"[\d,]+\.\d{2}"
    
    # Grand Total
    total_matches = re.findall(r"(Total|Grand\s*Total|Amount\s*Due)[:.]?\s*(" + amount_re + ")", full_text, re.IGNORECASE)
    if total_matches:
        financials["grand_total"] = _parse_amount(total_matches[-1][1])
        
    # Tax
    tax_matches = re.findall(r"(Tax|GST|VAT)[:.]?\s*(" + amount_re + ")", full_text, re.IGNORECASE)
    if tax_matches:
        financials["tax"] = _parse_amount(tax_matches[-1][1])
        
    return financials

def cluster_columns(data, table_top, table_bottom):
    """
    Uses K-Means clustering on X-coordinates of numeric columns to identify Qty, Price, Total.
    """
    # 1. Filter data to find potential table content (within vertical bounds)
    table_rows = [d for d in data if table_top <= d['top'] <= table_bottom]
    
    if not table_rows:
        return None
        
    # 2. Identify numeric words (candidates for Qty, Rate, Total)
    numeric_words = []
    for d in table_rows:
        # Check if text is a number
        clean = d['text'].replace(',', '').replace('.', '')
        if clean.isdigit():
            # Store center x-coordinate
            center_x = d['left'] + d['width'] / 2
            numeric_words.append(center_x)
            
    if len(numeric_words) < 3:
        logging.warning("Not enough numeric data for clustering.")
        return None
        
    # 3. K-Means Clustering (Expect at least 3 numeric columns usually: Qty, Rate, Total)
    # We might have more (HSN, SrNo, etc.), but let's try 3 main ones or dynamic
    try:
        X = np.array(numeric_words).reshape(-1, 1)
        kmeans = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)
        centers = sorted(kmeans.cluster_centers_.flatten())
        
        # Centers correspond to [Col 1, Col 2, Col 3] -> likely [Qty, Rate, Total] logic usually
        # But order depends on layout. Usually Qty < Rate < Total/Amount spatially? 
        # Actually usually: Qty (left), Rate (middle), Total (right)
        
        return {
            "qty_center": centers[0],
            "rate_center": centers[1],
            "total_center": centers[2]
        }
    except Exception as e:
        logging.warning(f"Clustering failed: {e}")
        return None

def extract_line_items_structured(data):
    """
    Extracts line items using spatial clustering.
    """
    items = []
    
    # 1. Approximate Table Region
    # Find "Description" and "Total" headers to frame the table
    headers = [d for d in data if d['text'].lower() in ["description", "particulars", "item", "product", "total", "amount"]]
    if not headers:
        return []
        
    table_top = min([d['top'] for d in headers])
    table_bottom = max([d['top'] for d in data]) # Just go to bottom for now, or stop at "Subtotal"
    
    # Refine bottom: Stop at "Subtotal" or "Grand Total"
    footers = [d for d in data if d['text'].lower() in ["subtotal", "total", "tax", "vat"]]
    if footers:
        # filter those below the header
        footers = [f for f in footers if f['top'] > table_top + 50]
        if footers:
            table_bottom = min([f['top'] for f in footers])
            
    # 2. Cluster Columns
    centers = cluster_columns(data, table_top, table_bottom)
    
    if not centers:
        return [] # Fallback necessary
        
    # 3. Row Iteration
    # Group words by Y-coordinate (lines)
    # Allow small y-variance
    lines = {}
    for d in data:
        if not (table_top < d['top'] < table_bottom):
            continue
            
        # Bin y-coords
        y_bin = int(d['top'] / 10) * 10 
        if y_bin not in lines:
            lines[y_bin] = []
        lines[y_bin].append(d)
        
    sorted_y = sorted(lines.keys())
    
    for y in sorted_y:
        row_words = lines[y]
        
        # Assign words to columns based on distance to centers
        qty_cand = []
        rate_cand = []
        total_cand = []
        desc_cand = []
        
        for w in row_words:
            center_x = w['left'] + w['width'] / 2
            
            # Simple distance check
            d_qty = abs(center_x - centers['qty_center'])
            d_rate = abs(center_x - centers['rate_center'])
            d_total = abs(center_x - centers['total_center'])
            
            min_dist = min(d_qty, d_rate, d_total)
            
            # If it's far to the left of Qty, it's description
            if center_x < centers['qty_center'] - 50:
                 desc_cand.append(w['text'])
                 continue
                 
            # Assign to closest numeric column if it looks numeric
            clean_txt = w['text'].replace(',', '').replace('.', '')
            if clean_txt.isdigit() and min_dist < 100: # Threshold
                if min_dist == d_qty:
                    qty_cand.append(w['text'])
                elif min_dist == d_rate:
                    rate_cand.append(w['text'])
                else:
                    total_cand.append(w['text'])
            else:
                # likely description part or noise
                desc_cand.append(w['text'])
                
        # Construct item
        if total_cand: # Need at least a total
            qty = _parse_amount(qty_cand[0]) if qty_cand else 1.0
            rate = _parse_amount(rate_cand[0]) if rate_cand else 0.0
            total = _parse_amount(total_cand[0]) if total_cand else 0.0
            
            # Validation and Recalculation
            # User request: "total ... calculated by multiplying the quantity and the price ... to reveerfy"
            
            # 1. If we have Qty and Rate, trust them and calculate Total
            if qty > 0 and rate > 0:
                total = round(qty * rate, 2)
                
            # 2. If Rate is missing but we have Total and Qty, derive Rate
            elif rate == 0 and qty > 0 and total > 0:
                rate = round(total / qty, 2)
                
            # 3. If Qty is missing (defaulted to 1.0 above) but we have Total and Rate
            # (Note: qty is already defaulted to 1.0 if missing, so this check might be redundant 
            # unless we distinguish 'missing' from '1.0'. Assuming default 1.0 is fine for now)

            items.append({
                "description": " ".join(desc_cand),
                "quantity": qty,
                "unit_price": rate,
                "line_total": total
            })
            
    return items

def _parse_amount(amount_str):
    try:
        if not amount_str: return 0.0
        clean = re.sub(r"[^\d.]", "", amount_str)
        return float(clean)
    except:
        return 0.0

def parse_invoice_image(image_path):
    try:
        # 1. Preprocess
        img, _, thresh = preprocess_image(image_path)
        
        # 2. Extract Data
        if USE_PADDLE:
            data = extract_text_paddle(img)
        else:
            data = extract_text_tesseract(thresh)
            
        # 3. Logical Extraction
        header = extract_header_info(data)
        financials = extract_financials(data)
        
        # 4. Structured Line Items
        line_items = extract_line_items_structured(data)
        
        return {
            "invoice_metadata": header,
            "financials": financials,
            "line_items": line_items
        }
        
    except Exception as e:
        logging.error(f"Processing error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    result = parse_invoice_image(image_path)
    print(json.dumps(result, indent=2))
