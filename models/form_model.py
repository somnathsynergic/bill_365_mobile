from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Annotated, Union, Optional

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

class CreatePIN(BaseModel):
    PIN:str
    phone_no:str

class UserLogin(BaseModel):
    user_id:str
    fcm_token:str
    # PIN:str

class LoginStatus(BaseModel):
    user_id:str

class Receipt(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    price:float
    dis_pertg:float
    discount_amt:float
    cgst_prtg:float
    cgst_amt:float
    sgst_prtg:float
    sgst_amt:float
    qty:int
    tprice:float
    tdiscount_amt:float
    # tcgst_amt:float
    # tsgst_amt:float
    amount:float
    round_off:float
    net_amt:int
    pay_mode:str
    received_amt:str
    pay_dtls:str
    cust_name:str
    phone_no:Optional[str] = None
    rcv_cash_flag:str
    gst_flag:str
    gst_type:str
    discount_flag:str
    discount_type:str
    discount_position:str
    created_by:str
    rcpt_type:str
    cust_info_flag:int
    stock_flag:str
    kot_flag:str
    table_no:int

class DashBoard(BaseModel):
    trn_date:date
    comp_id:int
    br_id:int
    user_id:str

class SearchBill(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:str

class SearchByRcpt(BaseModel):
    comp_id:int
    br_id:int
    receipt_no:int

class SearchByName(BaseModel):
    comp_id:int
    br_id:int
    cust_name:str

class SaleReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int

class GSTStatement(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:int

class GSTSummary(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:int

class CancelReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int

class DaybookReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int

class ItemReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int

class UserwiseReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:str

class EditHeaderFooter(BaseModel):
    comp_id:int
    header1:str
    on_off_flag1:str
    header2:str
    on_off_flag2:str
    footer1:str
    on_off_flag3:str
    footer2:str
    on_off_flag4:str
    created_by:str
    logo_flag:str

class EditItem(BaseModel):
    comp_id:int
    item_name:str
    br_id:int
    item_id:int
    price:float
    discount:float
    cgst:float
    sgst:float
    unit_id:int
    catg_id:int
    modified_by:str
    purchase_price:float    
    selling_price:float
    barcode:str
    description:str
    alert:str
    sp_gst_flag:str 
    pp_gst_flag:str
    opening_stock:int
    low_stock_qty:int
    batchwise_flag:str
    mfg_dt:str
    expiry_dt:str
    stock_flag:str

    
class DiscountSettings(BaseModel):
    comp_id:int
    discount_flag:str
    discount_type:str
    discount_position:str
    modified_by:str

class GSTSettings(BaseModel):
    comp_id:int
    gst_flag:str
    gst_type:str
    modified_by:str

class GeneralSettings(BaseModel):
    comp_id:int
    rcv_cash_flag:str
    rcpt_type:str
    unit_flag:str
    cust_inf:str
    pay_mode:str
    stock_flag:str
    price_type:str
    refund_days:int
    kot_flag:str
    modified_by:str
    custom_sl_flag:str
    stock_alert_flag:str
    stock_alert_prtg:int
    print_op:str


class AddItem(BaseModel):
    comp_id:int
    br_id:int
    hsn_code:str
    item_name:str
    unit_id:int
    catg_id:int
    created_by:str
    price:float
    cgst:float
    sgst:float
    barcode:str
    purchase_price:float
    sale_price:float
    opening_stock:int
    batch_no:str
    expiry_dt:str
    description:str
    alert:str
    sp_gst_flag:str 
    pp_gst_flag:str
    disc_prtg_flag:str
    as_on_dt:str
    mfg_dt: str
    low_stock_qty: int
    batchwise_flag: str



class CancelBill(BaseModel):
    receipt_no:int
    user_id:str

class AddUnit(BaseModel):
    comp_id:int
    unit_name:str
    created_by:str

class EditUnit(BaseModel):
    comp_id:int
    sl_no:int
    unit_name:str
    modified_by:str

class InventorySearch(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    # user_id:str

class UpdateStock(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    user_id:str
    added_stock:int
    removed_stock:int


class OpenStock(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    user_id:str
    stock:int
    # flag:int  # 0 = out , 1 = in

class StockReport(BaseModel):
    comp_id:int
    br_id:int

# class CancelBillReport(BaseModel):
#     from_date:date
#     to_date:date

# class CancelItem(BaseModel):
#     user_id:str
#     receipt_no:int
#     item_id:int
#     qty:int

class RefundItem(BaseModel):
    user_id:str
    receipt_no:int
    comp_id:int
    br_id:int
    item_id:int
    price:float
    dis_pertg:float
    discount_amt:float
    cgst_prtg:float
    cgst_amt:float
    sgst_prtg:float
    sgst_amt:float
    qty:int
    tprice:float
    tdiscount_amt:float
    tot_refund_amt:float
    round_off:float
    net_amt:int
    pay_mode:str
    received_amt:str
    cust_name:str
    phone_no:str
    gst_flag:str
    gst_type:str
    discount_flag:str
    discount_type:str
    discount_position:str

class RefundList(BaseModel):
    comp_id:int
    br_id:int
    phone_no:str
    ref_days:int

class RefundBillReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:str

# class CustomerDetails(BaseModel):
#     phone_no:str

class CustInfo(BaseModel):
    comp_id:int
    phone_no:str

class BillList(BaseModel):
    comp_id:int
    br_id:int
    phone_no:str

class SearchByItem(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    from_date:str
    to_date:str

class CreditReport(BaseModel):
    from_date:date
    to_date:date
    comp_id:int
    br_id:int
    user_id:str

class RecoverBill(BaseModel):
    comp_id:int
    br_id:int
    phone_no:str

# class RecoveryUpdate(BaseModel):
#     receipt_no:int
#     received_amt:int
#     pay_mode:str
#     user_id:str

class RecoveryUpdate(BaseModel):
    comp_id:int
    br_id:int
    phone_no:str
    received_amt:int
    pay_mode:str
    user_id:str

class LoginFlag(BaseModel):
    comp_id:int
    br_id:int
    user_id:str

class SearchByBarcode(BaseModel):
    comp_id:int
    bar_code:str

class SearchByCategory(BaseModel):
    comp_id:int
    catg_id:int
    br_id:int

class EditCategory(BaseModel):
    comp_id:int
    sl_no:int
    category_name:str
    modified_by:str

class AddCategory(BaseModel):
    comp_id:int
    category_name:str
    created_by:str

class CustomerLedger(BaseModel):
    comp_id:int
    br_id:int
    phone_no:str

class RecveryReport(BaseModel):
    comp_id:int
    br_id:int
    from_date:date
    to_date:date

class DueReport(BaseModel):
    comp_id:int
    br_id:int
    date:date

class CalReceipt(BaseModel):
    comp_id:int
    br_id:int
    price:float
    qty:int
    tprice:float
    round_off:float
    net_amt:int
    created_by:str

class StockIn(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    in_price:Optional[float] = None
    in_cgst:Optional[float] = None
    in_sgst:Optional[float] = None
    qty:int
    created_by:str
    exp_dt:Optional[str] = None
    mfg_dt:Optional[str] = None
    batch_no:Optional[str] = None
    sale_price:Optional[float] = None

class StockOut(BaseModel):
    comp_id:int
    br_id:int
    item_id:int
    qty:int
    damage_flag:str
    remarks:Optional[str] = None
    created_by:str