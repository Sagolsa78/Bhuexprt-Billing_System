import sys
import os
import json
from unittest.mock import MagicMock

# Mock cv2 and pytesseract before importing ocr_service
sys.modules["cv2"] = MagicMock()
sys.modules["pytesseract"] = MagicMock()
sys.modules["numpy"] = MagicMock()

# Add current directory to sys.path to import ocr_service
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import ocr_service

# Mock data simulating pytesseract.image_to_data output
# We need to construct a scenario where the "last 3 numbers" logic fails
# Invoice row: "Marginal 1FIT 10KG, ..., 1, 5567.033, 3, 167.011, ..., 6245.000"

def create_mock_data():
    # Headers
    headers = ["Item", "Description", "HSN/SAC", "Batch", "Expiry", "Quantity", "Rate", "Discount", "%", "Amount", "Taxable", "Value", "CGST", "Amount", "SGST", "Amount", "Total", "Amount"]
    
    # data structure: {'level': [], 'page_num': [], 'block_num': [], 'par_num': [], 'line_num': [], 'word_num': [], 'left': [], 'top': [], 'width': [], 'height': [], 'conf': [], 'text': []}
    data = {
        'level': [], 'page_num': [], 'block_num': [], 'par_num': [], 'line_num': [], 'word_num': [], 
        'left': [], 'top': [], 'width': [], 'height': [], 'conf': [], 'text': []
    }
    
    def add_word(text, left, top, width=50, height=20, line_num=0):
        data['level'].append(5)
        data['page_num'].append(1)
        data['block_num'].append(1)
        data['par_num'].append(1)
        data['line_num'].append(line_num)
        data['word_num'].append(len(data['text']) + 1)
        data['left'].append(left)
        data['top'].append(top)
        data['width'].append(width)
        data['height'].append(height)
        data['conf'].append(90)
        data['text'].append(text)
    
    # Line 1: Headers
    current_left = 10
    line_num = 1
    # Define approximate x-positions for headers
    # Quantity: ~400
    # Rate: ~460
    # Total: ~900
    
    # We'll explicitly set these positions to simulate the table layout
    
    add_word("Item", 10, 50, 40, 20, line_num)
    add_word("Description", 60, 50, 80, 20, line_num)
    
    add_word("Quantity", 400, 50, 60, 20, line_num)
    add_word("Rate", 480, 50, 50, 20, line_num)
    add_word("Discount", 550, 50, 50, 20, line_num)
    add_word("Total", 900, 50, 50, 20, line_num)
        
    # Line 2: The Data Row
    line_num = 2
    y = 80
    
    # "Marginal 1FIT 10KG"
    add_word("Marginal", 10, y, 60, 20, line_num)
    add_word("1FIT", 75, y, 40, 20, line_num)
    add_word("10KG", 120, y, 40, 20, line_num)
    
    # Quantity: 1 (Aligned under "Quantity" header at 400)
    add_word("1", 410, y, 20, 20, line_num)
    
    # Rate: 5567.033 (Aligned under "Rate" header at 480)
    add_word("5567.033", 480, y, 60, 20, line_num)
    
    # Discount: 3
    add_word("3", 550, y, 20, 20, line_num)
    
    # Taxable Value 5292.022
    add_word("5292.022", 600, y, 60, 20, line_num)
    
    # CGST 9 476.282
    add_word("9", 700, y, 20, 20, line_num)
    add_word("476.282", 730, y, 50, 20, line_num)
    
    # SGST 9 476.282
    add_word("9", 800, y, 20, 20, line_num)
    add_word("476.282", 830, y, 50, 20, line_num)
    
    # Round Off 0.414
    add_word("0.414", 890, y, 30, 20, line_num)
    
    # Total: 6245.000 (Aligned under "Total" header ~900)
    add_word("6245.000", 920, y, 60, 20, line_num)
    
    return data

def test_extraction():
    data = create_mock_data()
    
    # Reconstruct raw text from data for the old function to use
    
    lines = {}
    for i in range(len(data['text'])):
        ln = data['line_num'][i]
        txt = data['text'][i]
        if ln not in lines: lines[ln] = []
        lines[ln].append(txt)
        
    raw_text = ""
    for ln in sorted(lines.keys()):
        raw_text += " ".join(lines[ln]) + "\n"
        
    print("--- RAW TEXT ---")
    print(raw_text)
    print("----------------")
    
    print("Running extract_line_items with raw text and layout data...")
    try:
        # Pass data to the new coordinate-based logic
        items = ocr_service.extract_line_items(raw_text, data=data)
        print("Extracted Items (New Logic):")
        print(json.dumps(items, indent=2))
        
        # Check correctness
        if len(items) > 0:
            item = items[0]
            # Expected: Qty=1, Price=5567.033, Total=6245.000
            print(f"Verified: Qty={item['quantity']}, Price={item['unit_price']}, Total={item['line_total']}")
            
            # Allow some float tolerance
            if item['quantity'] == 1 and abs(item['unit_price'] - 5567.033) < 0.01:
                 print("SUCCESS: Extraction correct")
            else:
                 print("FAILURE: Extraction incorrect")
                 
    except Exception as e:
        print(f"New logic failed: {e}")
    
    # Once we update ocr_service, we will call it like this:
    # items = ocr_service.extract_line_items(raw_text, data=data)

if __name__ == "__main__":
    test_extraction()
