import cv2
import numpy as np
import requests
import json
import logging
import time
import re
from paddleocr import PaddleOCR

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class InvoiceScanner:
    def __init__(self, ollama_url="http://localhost:11434"):
        self.ollama_url = ollama_url
        self.model = "phi3:3.8b"
        
        # Initialize PaddleOCR
        # lang='en' is standard. use_angle_cls=True helps with rotated text.
        logging.info("Initializing PaddleOCR...")
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        logging.info("PaddleOCR initialized.")

    def deskew_image(self, image_path):
        """
        Reads an image and applies deskewing using OpenCV.
        Returns the deskewed image as a numpy array.
        """
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Image not found: {image_path}")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.bitwise_not(gray)
        coords = np.column_stack(np.where(gray > 0))
        angle = cv2.minAreaRect(coords)[-1]

        # The cv2.minAreaRect function returns values in the range [-90, 0);
        # as the rectangle rotates clockwise the returned angle trends to 0.
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Rotate the image to deskew it
        (h, w) = img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        logging.info(f"Deskewed image by {angle:.2f} degrees.")
        return rotated

    def extract_text(self, img):
        """
        Runs PaddleOCR on the image (numpy array).
        Returns raw text string.
        """
        result = self.ocr.ocr(img, cls=True)
        if not result or result[0] is None:
            return ""
        
        # Flatten the result
        raw_text = []
        for line in result[0]:
            # line structure: [coords, [text, confidence]]
            text = line[1][0]
            raw_text.append(text)
            
        return "\n".join(raw_text)

    def _call_llm(self, text_content):
        """
        Sends the OCR text to Ollama (Phi3) for structured extraction.
        """
        prompt = f"""
        You are an intelligent invoice data extractor. 
        Extract the following fields from the OCR text below and return ONLY valid JSON.
        
        Fields to extract:
        - invoice_number (string)
        - date (string, ISO format YYYY-MM-DD if possible)
        - vendor_name (string)
        - customer_name (string)
        - total_amount (float)
        - tax_amount (float)
        - line_items (list of objects with: description, quantity, unit_price, total)

        OCR TEXT:
        {text_content}
        
        JSON OUTPUT:
        """
        
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": False,
            "format": "json" # Force JSON mode if supported by the model version or just prompt for it
        }
        
        try:
            start_time = time.time()
            response = requests.post(f"{self.ollama_url}/api/chat", json=payload)
            response.raise_for_status()
            duration = time.time() - start_time
            logging.info(f"LLM inference took {duration:.2f}s")
            
            result = response.json()
            content = result.get("message", {}).get("content", "")
            return self._clean_json(content)
            
        except requests.exceptions.RequestException as e:
            logging.error(f"Ollama API error: {e}")
            return {"error": "LLM extraction failed", "details": str(e)}

    def _clean_json(self, text):
        """
        Cleans the LLM output to ensure it's valid JSON.
        """
        try:
            # Try to parse directly
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON block
            match = re.search(r'\{.*\}', text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except:
                    pass
            logging.warning("Failed to parse JSON from LLM response.")
            return {"raw_output": text, "error": "JSON parse error"}

    def extract(self, image_path):
        """
        Main pipeline: Deskew -> OCR -> LLM -> JSON.
        """
        start_time = time.time()
        
        try:
            # 1. Image Preprocessing
            img = self.deskew_image(image_path)
            
            # 2. OCR
            text = self.extract_text(img)
            logging.info(f"OCR extracted {len(text)} characters.")
            
            # 3. LLM Extraction
            data = self._call_llm(text)
            
            total_time = time.time() - start_time
            data["processing_time_seconds"] = round(total_time, 2)
            
            return data
            
        except Exception as e:
            logging.error(f"Extraction failed: {e}")
            return {"error": str(e)}

if __name__ == "__main__":
    # Simple CLI test
    import sys
    if len(sys.argv) > 1:
        scanner = InvoiceScanner()
        print(json.dumps(scanner.extract(sys.argv[1]), indent=2))
    else:
        print("Usage: python invoice_scanner.py <image_path>")
