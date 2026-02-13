from PIL import Image, ImageDraw, ImageFont
import os

def create_dummy_invoice(filename="test_invoice.png"):
    # Create white image
    width, height = 800, 1000
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Try to load a font, fallback to default
    try:
        # Linux path often has DejaVuSans or similar
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 12)
    except IOError:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw Header
    draw.text((50, 50), "Acme Corp", font=font_large, fill="black")
    draw.text((50, 80), "123 Business Rd, Tech City", font=font_medium, fill="black")
    
    # Invoice Details
    draw.text((500, 50), "INVOICE", font=font_large, fill="black")
    draw.text((500, 90), "Invoice No: INV-2023-001", font=font_medium, fill="black")
    draw.text((500, 115), "Date: 25/10/2023", font=font_medium, fill="black")
    draw.text((500, 140), "Due Date: 30/11/2023", font=font_medium, fill="black")
    
    # Bill To
    draw.text((50, 150), "Bill To:", font=font_medium, fill="black")
    draw.text((50, 175), "John Doe", font=font_medium, fill="black")
    draw.text((50, 200), "Customer Address Line 1", font=font_small, fill="black")

    # Table Header
    y_start = 300
    draw.line((50, y_start, 750, y_start), fill="black", width=2)
    draw.text((50, y_start + 10), "Description", font=font_medium, fill="black")
    draw.text((400, y_start + 10), "Qty", font=font_medium, fill="black")
    draw.text((500, y_start + 10), "Unit Price", font=font_medium, fill="black")
    draw.text((650, y_start + 10), "Total", font=font_medium, fill="black")
    draw.line((50, y_start + 35, 750, y_start + 35), fill="black", width=1)

    # Line Items
    items = [
        ("Widget A", "2", "50.00", "100.00"),
        ("Service B", "1", "150.00", "150.00"),
        ("Gadget C", "5", "20.00", "100.00")
    ]
    
    y = y_start + 50
    for desc, qty, price, total in items:
        draw.text((50, y), desc, font=font_small, fill="black")
        draw.text((400, y), qty, font=font_small, fill="black")
        draw.text((500, y), price, font=font_small, fill="black")
        draw.text((650, y), total, font=font_small, fill="black")
        y += 30

    # Financials
    y += 50
    draw.line((400, y, 750, y), fill="black", width=1)
    
    draw.text((500, y + 10), "Subtotal:", font=font_medium, fill="black")
    draw.text((650, y + 10), "350.00", font=font_medium, fill="black")
    
    draw.text((500, y + 35), "Tax (10%):", font=font_medium, fill="black")
    draw.text((650, y + 35), "35.00", font=font_medium, fill="black")
    
    draw.line((400, y + 60, 750, y + 60), fill="black", width=2)
    draw.text((500, y + 70), "Grand Total:", font=font_large, fill="black")
    draw.text((650, y + 70), "385.00", font=font_large, fill="black")

    # Save
    image.save(filename)
    print(f"Generated {filename}")

if __name__ == "__main__":
    create_dummy_invoice()
