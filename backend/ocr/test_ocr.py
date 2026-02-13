import unittest
from ocr_service import parse_invoice_image
import os

class TestOCRService(unittest.TestCase):

    def test_invoice_parsing(self):
        # NOTE: This test requires a valid invoice image at 'test_invoice.jpg'
        # If no image is present, it will skip.
        image_path = 'test_invoice.jpg'
        
        if not os.path.exists(image_path):
            print(f"Skipping test: {image_path} not found.")
            return

        print(f"Testing OCR on {image_path}...")
        result = parse_invoice_image(image_path)
        
        self.assertIsInstance(result, dict)
        self.assertIn("invoice_metadata", result)
        self.assertIn("financials", result)
        self.assertIn("line_items", result)
        
        print("\nExtracted Data:")
        print(result)

if __name__ == '__main__':
    unittest.main()
