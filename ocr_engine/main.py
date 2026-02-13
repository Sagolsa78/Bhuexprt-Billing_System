from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
import uuid
from invoice_scanner import InvoiceScanner

app = FastAPI()
scanner = InvoiceScanner()

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/scan")
async def scan_invoice(file: UploadFile = File(...)):
    try:
        # Generate unique filename to avoid collisions
        file_ext = os.path.splitext(file.filename)[1]
        temp_filename = f"{uuid.uuid4()}{file_ext}"
        temp_path = os.path.join(TEMP_DIR, temp_filename)
        
        # Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process image
        result = scanner.extract(temp_path)
        
        # Cleanup
        os.remove(temp_path)
        
        if "error" in result:
             raise HTTPException(status_code=500, detail=result["error"])
             
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model": scanner.model}
