from fastapi import APIRouter
from config.database import connect
from models.master_model import createResponse
from models.form_model import OpenStock,InventorySearch,UpdateStock,StockReport,StockIn,StockOut

from datetime import datetime

# testing git
stockRouter = APIRouter()

# Inventory Searching
#---------------------------------------------------------------------------------------------------------------------------
@stockRouter.post('/stock')
async def stock(st_list:InventorySearch):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT stock FROM td_stock WHERE comp_id = {st_list.comp_id} AND br_id = {st_list.br_id} AND item_id = {st_list.item_id}"
    cursor.execute(query)
    records = cursor.fetchall()
    result = createResponse(records, cursor.column_names, 1)
    conn.close()
    cursor.close()
    return result[0]

# Stock update
#---------------------------------------------------------------------------------------------------------------------------
@stockRouter.post('/update_stock')
async def update_stock(update:UpdateStock):
    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        query = f"UPDATE td_stock SET stock=(stock+{update.added_stock})-{update.removed_stock}, modified_by='{update.user_id}', modified_dt='{formatted_dt}' WHERE comp_id={update.comp_id} AND br_id={update.br_id} AND item_id={update.item_id}"
        cursor.execute(query)
        conn.commit()
        conn.close()
        cursor.close()
        if cursor.rowcount>0:
            resData= {  
            "status":1,
            "data":"Stock updated Successfully"
            }
        else:
            resData= {
            "status":0, 
            "data":"Error while updating Stock"
            }
    except:
        print("An exception occurred")
    finally:
        return resData

# Stock Report
#---------------------------------------------------------------------------------------------------------------------------
@stockRouter.post('/stock_report')
async def stock_report(stk_rep:StockReport):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT a.item_id, b.item_name, c.unit_name, a.stock, a.created_by, a.created_dt, a.modified_by, a.modified_dt FROM td_stock a JOIN md_items b ON  a.item_id=b.id AND a.comp_id=b.comp_id LEFT JOIN md_unit c on c.sl_no=b.unit_id WHERE a.comp_id={stk_rep.comp_id} AND a.br_id={stk_rep.br_id}"
    cursor.execute(query)
    records = cursor.fetchall()
    result = createResponse(records,cursor.column_names,1)
    conn.close()
    cursor.close()
    return result


# @stockRouter.post('/stock_open')
# async def update_stock(update:OpenStock):
    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        query = f"insert into td_stock_ledger (stock_trn_dt,stock_trn_id,comp_id, br_id, item_id, transaction_type, stock_qty,created_dt, created_by ) values (date('{formatted_dt}'), '{current_datetime}', {update.comp_id}, {update.br_id}, {update.item_id},'O', {update.stock}, date('{formatted_dt}'), '{update.user_id}')"
        cursor.execute(query)
        print(query)
        conn.commit()
        conn.close()
        cursor.close()
        
        try:
                    table_name2 = "td_stock_in"
                    fields2 = f"comp_id, br_id, in_date, item_id, in_price, in_cgst, in_sgst, qty"
                    values2 = f"{comp_id}, {br_id}, date('{formatted_dt}'), {row['item_id']}, {res_dt['msg'][0]['price']}, {res_dt['msg'][0]['cgst']}, {res_dt['msg'][0]['sgst']}, {row['stock']}"
                    where2 = None
                    flag2 = 0
                    res_dt3= await db_Insert(table_name2,fields2,values2,where2,flag2)
        except mysql.connector.Error as err:
                    print(err)

        if cursor.rowcount>0:
            resData= {  
            "status":1,
            "data":"Stock updated Successfully"
            }
        else:
            resData= {
            "status":0, 
            "data":"Error while updating Stock"
            }
    except:
        print("An exception occurred")
    # finally:
    #     return resData
    

    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        query = f"Insert td_stock (comp_id,br_id,item_id,stock,created_by,created_dt) values ({update.comp_id},{update.br_id},{update.item_id},{update.stock},'{update.user_id}','{formatted_dt}')"
        cursor.execute(query)
        print(query)
        conn.commit()
        conn.close()
        cursor.close()
        if cursor.rowcount>0:
            resData= {  
            "status":1,
            "data":"Stock updated Successfully"
            }
        else:
            resData= {
            "status":0, 
            "data":"Error while updating Stock"
            }
    except:
        print("An exception occurred")
    finally:
        return resData

# Stock In
#---------------------------------------------------------------------------------------------------------------------------
@stockRouter.post('/stock_in')
async def stock_in(data:StockIn):
    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        
        in_price = data.in_price if data.in_price is not None else 0
        sale_price = data.sale_price if data.sale_price is not None else 0
        in_cgst = data.in_cgst if data.in_cgst is not None else 0
        in_sgst = data.in_sgst if data.in_sgst is not None else 0
        
        exp_dt_val = f"'{data.exp_dt}'" if data.exp_dt else "NULL"
        mfg_dt_val = f"'{data.mfg_dt}'" if data.mfg_dt else "NULL"
        batch_no_val = f"'{data.batch_no}'" if data.batch_no else "NULL"
        
        query1 = f"INSERT INTO td_stock_in (comp_id,br_id,in_date,item_id,in_price,sale_price,in_cgst,in_sgst,qty,created_by,created_at,batch_no) VALUES ({data.comp_id},{data.br_id},'{formatted_dt}',{data.item_id},{in_price},{sale_price},{in_cgst},{in_sgst},{data.qty},'{data.created_by}','{formatted_dt}',{batch_no_val})"
        cursor.execute(query1)
        
        if cursor.rowcount > 0:
            where_clause = f"comp_id = {data.comp_id} AND br_id = {data.br_id} AND item_id = {data.item_id}" if data.br_id > 0 else f"comp_id = {data.comp_id} AND item_id = {data.item_id}"
            
            query2 = f"SELECT stock FROM td_stock WHERE {where_clause}"
            cursor.execute(query2)
            records = cursor.fetchall()
            
            if len(records) > 0:
                new_stock = data.qty + records[0][0]
                query3 = f"UPDATE td_stock SET stock = {new_stock}, modified_by='{data.created_by}',modified_dt = '{formatted_dt}' WHERE {where_clause}"
            else:
                query3 = f"INSERT INTO td_stock (comp_id,br_id,item_id,stock,created_by,created_dt) VALUES ({data.comp_id},{data.br_id},{data.item_id},{data.qty},'{data.created_by}','{formatted_dt}')"
                
            cursor.execute(query3)
            
            # Insert batch info into td_batch
            if data.batch_no or data.exp_dt or data.mfg_dt:
                query_batch = f"INSERT INTO td_batch (comp_id, br_id, item_id, batch_no, mfg_dt, exp_dt, created_by, created_at) VALUES ({data.comp_id}, {data.br_id}, {data.item_id}, {batch_no_val}, {mfg_dt_val}, {exp_dt_val}, '{data.created_by}', '{formatted_dt}')"
                cursor.execute(query_batch)
                
            # Update md_item_rate
            # Note: updating with item_id, as md_item_rate typically doesn't contain br_id
            query_rate = f"UPDATE md_item_rate SET cgst = {in_cgst}, sgst = {in_sgst}, sale_price = {sale_price}, purchase_price = {in_price}, modified_by = '{data.created_by}', modified_dt = '{formatted_dt}' WHERE item_id = {data.item_id}"
            cursor.execute(query_rate)
                
            conn.commit()
            
            resData = {
                "status": 1,
                "data": "Stock updated Successfully"
            }
        else:
            conn.rollback()
            resData = {
                "status": 0,
                "data": "Error while updating Stock In"
            }
        conn.close()
        cursor.close()
    except Exception as e:
        print("An exception occurred:", e)
        resData = {
            "status": 0, 
            "data": "Error while updating Stock In"
        }
    finally:
        return resData

# Stock Out
#---------------------------------------------------------------------------------------------------------------------------
@stockRouter.post('/stock_out')
async def stock_out(data:StockOut):
    resData = {"status": 0, "data": "Error while processing Stock Out"}
    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        
        query1 = f"SELECT a.price, a.cgst, a.sgst, b.stock FROM md_item_rate a, td_stock b WHERE a.item_id=b.item_id AND a.item_id={data.item_id} AND b.comp_id={data.comp_id} AND b.br_id={data.br_id}"
        cursor.execute(query1)
        records = cursor.fetchall()
        
        if records:
            price = records[0][0]
            cgst_prtg = records[0][1]
            sgst_prtg = records[0][2]
            current_stock = records[0][3]
            
            if current_stock >= data.qty:
                cgst_amt = price * (cgst_prtg / 100)
                sgst_amt = price * (sgst_prtg / 100)
                remarks_val = data.remarks if data.remarks else ""
                
                query2 = f"INSERT INTO td_return (comp_id, br_id, trn_date, item_id, qty, price, cgst_prtg, cgst_amt, sgst_prtg, sgst_amt, damage_flag, remarks, created_by, created_dt) VALUES ({data.comp_id}, {data.br_id}, DATE('{formatted_dt}'), {data.item_id}, {data.qty}, {price}, {cgst_prtg}, {cgst_amt}, {sgst_prtg}, {sgst_amt}, '{data.damage_flag}', '{remarks_val}', '{data.created_by}', '{formatted_dt}')"
                cursor.execute(query2)
                conn.commit()
                
                if cursor.rowcount > 0:
                    new_stock = current_stock - data.qty
                    where_clause = f"comp_id = {data.comp_id} AND br_id = {data.br_id} AND item_id = {data.item_id}" if data.br_id > 0 else f"comp_id = {data.comp_id} AND item_id = {data.item_id}"
                    
                    query3 = f"UPDATE td_stock SET stock = {new_stock}, modified_by = '{data.created_by}', modified_dt = '{formatted_dt}' WHERE {where_clause}"
                    cursor.execute(query3)
                    conn.commit()
                    
                    resData = {
                        "status": 1,
                        "data": "Stock updated Successfully"
                    }
                else:
                    resData = {
                        "status": 0,
                        "data": "Error while inserting td_return"
                    }
            else:
                resData = {
                    "status": 0,
                    "data": "Insufficient stock quantity"
                }
        else:
            resData = {
                "status": 0,
                "data": "Stock/Rate information not found"
            }
        conn.close()
        cursor.close()
    except Exception as e:
        print("An exception occurred:", e)
    finally:
        return resData
