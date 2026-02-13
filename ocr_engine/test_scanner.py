import unittest
import os
import json
from PIL import Image, ImageDraw, ImageFont
from invoice_scanner import InvoiceScanner

class TestInvoiceScanner(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Generates a dummy invoice image for testing."""
        cls.test_image_path = "test_invoice_generated.png"
        cls.create_dummy_invoice(cls.test_image_path)
        cls.scanner = InvoiceScanner()

    @classmethod
    def tearDownClass(cls):
        """Cleanup."""
        if os.path.exists(cls.test_image_path):
             os.remove(cls.test_image_path)

    @staticmethod
    def create_dummy_invoice(filename):
        width, height = 800, 1000
        image = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype("DejaVuSans.ttf", 16)
        except:
            font = ImageFont.load_default()

        # Simple invoice content
        draw.text((50, 50), "Test Vendor Inc.", fill="black", font=font)
        draw.text((500, 50), "INVOICE #INV-12345", fill="black", font=font)
        draw.text((500, 70), "Date: 2023-10-27", fill="black", font=font)
        
        draw.text((50, 150), "Description", fill="black", font=font)
        draw.text((400, 150), "Qty", fill="black", font=font)
        draw.text((500, 150), "Price", fill="black", font=font)
        draw.text((600, 150), "Total", fill="black", font=font)
        
        draw.text((50, 180), "Test Item A", fill="black", font=font)
        draw.text((400, 180), "2", fill="black", font=font)
        draw.text((500, 180), "50.00", fill="black", font=font)
        draw.text((600, 180), "100.00", fill="black", font=font)
        
        draw.text((400, 250), "Total:", fill="black", font=font)
        draw.text((600, 250), "100.00", fill="black", font=font)
        
        image.save(filename)

    def test_extract_functionality(self):
        """Tests the end-to-end extraction."""
        print(f"\nScanning {self.test_image_path}...")
        result = self.scanner.extract(self.test_image_path)
        
        print("\nJSON Result:")
        print(json.dumps(result, indent=2))
        
        self.assertNotIn("error", result, "Extraction returned an error")
        self.assertIn("invoice_number", result)
        # Note: OCR accuracy varies, so loose checks are better for unit tests unless we mock OCR
        # But here we want integration test
        
if __name__ == "__main__":
    unittest.main()
