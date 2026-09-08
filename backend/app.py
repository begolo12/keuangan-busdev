import os
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.database import (
    init_db, get_summary, get_settings, update_setting,
    get_members, get_member, add_member, update_member, delete_member,
    update_member_opname, get_transactions, get_transaction,
    add_transaction, update_transaction, delete_transaction,
    get_categories, seed_from_excel
)
from backend.excel_service import export_database_to_excel, import_excel_to_database

# Initialize DB on import
init_db()

app = FastAPI(title="Keuangan Busdev API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class SettingUpdate(BaseModel):
    key: str
    value: str

class MemberCreate(BaseModel):
    name: str
    divisi: str
    uang_fisik: Optional[float] = 0
    urutan: Optional[int] = 0

class MemberUpdate(BaseModel):
    name: str
    divisi: str
    uang_fisik: Optional[float] = None
    urutan: Optional[int] = None

class OpnameUpdate(BaseModel):
    uang_fisik: float

class TransactionCreate(BaseModel):
    member_id: int
    tanggal: str
    no_bukti: str
    keterangan: str
    kategori: str
    masuk: Optional[float] = 0
    keluar: Optional[float] = 0
    status_bukti: Optional[str] = "Nota Lengkap"

class TransactionUpdate(BaseModel):
    member_id: int
    tanggal: str
    no_bukti: str
    keterangan: str
    kategori: str
    masuk: Optional[float] = 0
    keluar: Optional[float] = 0
    status_bukti: Optional[str] = "Nota Lengkap"

# Routes
@app.get("/api/summary")
def api_summary():
    return get_summary()

@app.get("/api/settings")
def api_get_settings():
    return get_settings()

@app.post("/api/settings")
def api_update_setting(data: SettingUpdate):
    update_setting(data.key, data.value)
    return {"status": "ok", "key": data.key, "value": data.value}

@app.get("/api/members")
def api_get_members():
    return get_members()

@app.get("/api/members/{member_id}")
def api_get_member(member_id: int):
    m = get_member(member_id)
    if not m:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
    return m

@app.post("/api/members")
def api_add_member(data: MemberCreate):
    new_id = add_member(data.name, data.divisi, data.uang_fisik, data.urutan)
    return {"status": "ok", "id": new_id}

@app.put("/api/members/{member_id}")
def api_update_member(member_id: int, data: MemberUpdate):
    update_member(member_id, data.name, data.divisi, data.uang_fisik, data.urutan)
    return {"status": "ok"}

@app.delete("/api/members/{member_id}")
def api_delete_member(member_id: int):
    delete_member(member_id)
    return {"status": "ok"}

@app.post("/api/members/{member_id}/opname")
def api_update_opname(member_id: int, data: OpnameUpdate):
    update_member_opname(member_id, data.uang_fisik)
    return {"status": "ok", "uang_fisik": data.uang_fisik}

@app.get("/api/transactions")
def api_get_transactions(
    member_id: Optional[int] = None,
    search: Optional[str] = None,
    kategori: Optional[str] = None,
    jenis: Optional[str] = None,
    status_bukti: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    return get_transactions(
        member_id=member_id,
        search=search,
        kategori=kategori,
        jenis=jenis,
        status_bukti=status_bukti,
        date_from=date_from,
        date_to=date_to
    )

@app.get("/api/transactions/{tx_id}")
def api_get_transaction(tx_id: int):
    tx = get_transaction(tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return tx

@app.post("/api/transactions")
def api_add_transaction(data: TransactionCreate):
    new_id = add_transaction(
        data.member_id, data.tanggal, data.no_bukti, data.keterangan,
        data.kategori, data.masuk, data.keluar, data.status_bukti
    )
    return {"status": "ok", "id": new_id}

@app.put("/api/transactions/{tx_id}")
def api_update_transaction(tx_id: int, data: TransactionUpdate):
    update_transaction(
        tx_id, data.member_id, data.tanggal, data.no_bukti, data.keterangan,
        data.kategori, data.masuk, data.keluar, data.status_bukti
    )
    return {"status": "ok"}

@app.delete("/api/transactions/{tx_id}")
def api_delete_transaction(tx_id: int):
    delete_transaction(tx_id)
    return {"status": "ok"}

@app.get("/api/categories")
def api_get_categories():
    return get_categories()

@app.get("/api/export-excel")
def api_export_excel():
    excel_file = export_database_to_excel()
    return Response(
        content=excel_file.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Keuangan_Busdev_Rekapitulasi.xlsx"'}
    )

@app.post("/api/import-excel")
async def api_import_excel(file: UploadFile = File(...)):
    contents = await file.read()
    import_excel_to_database(contents)
    return {"status": "ok", "message": "Data berhasil diimpor dari Excel"}

@app.post("/api/reset-data")
def api_reset_data():
    seed_from_excel()
    return {"status": "ok", "message": "Data berhasil di-reset ke data awal Excel"}

# Static files
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
