from fastapi import APIRouter,File, UploadFile, Depends, Form
from config.database import connect
from models.master_model import createResponse
from models.form_model import SearchByCategory, EditCategory, AddCategory
from datetime import datetime
from typing import Optional
from urllib.parse import quote
import os
# testing git
categoryRouter = APIRouter()
UPLOAD_FOLDER = "upload_file"

@categoryRouter.get('/category_list/{comp_id}')
async def category_list(comp_id:int):
    conn = connect()
    cursor = conn.cursor()
    query = f"SELECT sl_no, category_name, catg_picture FROM md_category WHERE comp_id={comp_id}"
    cursor.execute(query)
    records = cursor.fetchall()
    result = createResponse(records, cursor.column_names, 1)
    # conn.close()
    # cursor.close()
    if cursor.rowcount>0:
        res_dt={"status":1, "msg":result}
        conn.close()
        cursor.close()
    else:
        res_dt={"status":0, "msg":[]}
        conn.close()
        cursor.close()
    return res_dt

#==========================================================================================================
# Search Items by Category:

@categoryRouter.post('/categorywise_item_list')
async def categorywise_item_list(catg:SearchByCategory):
    conn = connect()
    cursor = conn.cursor()
    # query = f"SELECT a.*, b.*, c.unit_name, d.stock FROM md_items a JOIN md_item_rate b on a.id=b.item_id LEFT JOIN md_unit c on c.sl_no=a.unit_id LEFT JOIN td_stock d on d.comp_id=a.comp_id and d.item_id=a.id WHERE a.comp_id={catg.comp_id} AND a.catg_id={catg.catg_id} AND d.br_id={catg.br_id}"
    query = f"SELECT a.*, b.*, c.unit_name FROM md_items a JOIN md_item_rate b on a.id=b.item_id LEFT JOIN md_unit c on c.sl_no=a.unit_id WHERE a.comp_id={catg.comp_id} AND a.catg_id={catg.catg_id}"
    cursor.execute(query)
    records = cursor.fetchall()
    result = createResponse(records, cursor.column_names, 1)
    print(result)
    
    if cursor.rowcount>0:
        res_dt={"status":1, "msg":result}
    else:
        res_dt={"status":0, "msg":[]}
    conn.close()
    cursor.close()
    return res_dt


@categoryRouter.post('/edit_category')
async def edit_category(edit:EditCategory):
    try:
        current_datetime = datetime.now()
        formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
        conn = connect()
        cursor = conn.cursor()
        query = f"UPDATE md_category SET category_name='{edit.category_name}', modified_by='{edit.modified_by}', modified_at='{formatted_dt}' WHERE sl_no={edit.sl_no} and comp_id={edit.comp_id}"
        cursor.execute(query)
        conn.commit()
        conn.close()
        cursor.close()
        if cursor.rowcount>0:
            resData= {  
            "status":1,
            "data":"Category Edited Successfully"
            }
        else:
            resData= {
            "status":0, 
            "data":"Error while updating Category."
            }
    except:
        print("An exception occurred")
    finally:
        return resData
    

@categoryRouter.post('/add_category')
async def add_category(add_cat:AddCategory):
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
    conn = connect()
    cursor = conn.cursor()
    query = f"INSERT INTO md_category(comp_id, category_name, created_by, created_at) VALUES ({add_cat.comp_id}, '{add_cat.category_name}', '{add_cat.created_by}', '{formatted_dt}')"
    cursor.execute(query)
    conn.commit()
    conn.close()
    cursor.close()
    if cursor.rowcount>0:
        resData={
            "status":1,
            "data":"Category Added Successfully"
        }
    else:
        resData={
            "status":0,
            "data":"Category Not Added"
        }
    return resData

async def uploadfile(file):
    current_datetime = datetime.now()
    receipt = int(round(current_datetime.timestamp()))
    modified_filename = f"{receipt}_{file.filename}"
    res = ""
    try:
        file_location = os.path.join(UPLOAD_FOLDER, modified_filename)
        print(file_location)
        
        with open(file_location, "wb") as f:
            f.write(await file.read())
        
        res = modified_filename
        print(res)
    except Exception as e:
        # res = e.args
        res = ""
    finally:
        return res

@categoryRouter.post('/add_category_test')
async def add_edit_category(
    comp_id: str = Form(...),
    category_name: str = Form(...),
    created_by: str = Form(...),
    category_picture: Optional[UploadFile] = File(None)
    ):
    print("api has been hit")
    print(category_picture)
    fileName = None if not category_picture else await uploadfile(category_picture)
    print(fileName,"mmmmmmmmmm")
    conn = connect()
    cursor = conn.cursor()
    current_datetime = datetime.now()
    formatted_dt = current_datetime.strftime("%Y-%m-%d %H:%M:%S")
   
    catg_pic1 = f",'/uploads/{fileName}'" if fileName != None else ', ""'

    query = f"INSERT INTO md_category(comp_id, category_name, catg_picture,created_by, created_at) VALUES ({comp_id}, '{category_name}','{catg_pic1}' , '{created_by}', '{formatted_dt}')"
    cursor.execute(query)
    conn.commit()
    conn.close()
    cursor.close()
    if cursor.rowcount>0:
        resData={
            "status":1,
            "data":"Category Added Successfully"
        }
    else:
        resData={
            "status":0,
            "data":"Category Not Added"
        }
    
    return resData