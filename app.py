import os
import json
import re
from typing import Union
from fastapi import FastAPI, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from starlette.requests import Request
from fastapi.staticfiles import StaticFiles
import psycopg2
from dotenv import load_dotenv
import hmac
import hashlib
from urllib.parse import unquote

load_dotenv()

con = {
    'host': os.environ.get("PG_HOST"),
    'port': os.environ.get("PG_PORT"),
    'user': os.environ.get("PG_USER"),
    'password': os.environ.get("PG_PASSWORD"),
    'database': os.environ.get("PG_DB")
}

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/")
async def index(request: Request, chat_id: Union[float, None] = None, tgWebAppStartParam: Union[float, None] = None):
    result_chat_id = 0
    if chat_id:
        result_chat_id = chat_id
    elif tgWebAppStartParam:
        result_chat_id = tgWebAppStartParam
    return templates.TemplateResponse("index.html", {"request": request, "result_chat_id": result_chat_id})


def is_data_verified(init_data: str = None):
    if init_data == '' or init_data is None:
        return False

    init_data_sorted = '\n'.join(sorted(unquote(init_data).split('&')[:-1]))
    res_hash = re.findall("hash=(\w+)", init_data)[0]

    secret_key = hmac.new(
        "WebAppData".encode(),
        msg=os.environ.get("TOKEN").encode(),
        digestmod=hashlib.sha256
    ).digest()

    data_check_string = hmac.new(
        secret_key,
        msg=init_data_sorted.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    if data_check_string != res_hash:
        return False
    else:
        return True


@app.post("/access_verification")
async def access_verification(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select count(*) > 0 is_access_granted
            from permissions p
            where p.tg_chat_id in ({res["chat_id"]})
            and p.tg_user_id = {res["user_id"]}
            and not p.is_deleted
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()][0]
        return JSONResponse(content=data)


@app.post("/get_user_info")
async def get_user_info(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select 
                tg_username,
                tg_first_name,
                tg_last_name,
                tg_profile_photo 
            from users
            where tg_user_id = {res["chat_id"]}
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()][0]
        return JSONResponse(content=data)


@app.post("/get_chat_info")
async def get_chat_info(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select 
                tg_chat_id,
                tg_chat_name,
                tg_chat_photo 
            from chats
            where tg_chat_id = {res["chat_id"]}
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()][0]
        return JSONResponse(content=data)


@app.post("/get_wishes")
async def get_wishes(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select 
                uw.id, 
                uw.name, 
                uw.description,
                uw.link, 
                uw.price,
                uw.currency,
                uw.image,  
                uw.is_booked, 
                uw.booked_by,
                uw.tg_user_id, 
                u.tg_username, 
                u.tg_first_name,
                u.tg_profile_photo, 
                c.tg_chat_id,
                c.tg_chat_name,
                c.tg_chat_photo
            from users_wishes uw
            join permissions p on uw.tg_user_id = p.tg_user_id
            join users u on uw.tg_user_id = u.tg_user_id
            join chats c on c.tg_chat_id = p.tg_chat_id
            where p.tg_chat_id in ({res["chat_id"]})
            and not uw.is_deleted
            and not p.is_deleted
            order by u.id, uw.is_booked, uw.id desc
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
        return JSONResponse(content=data)


@app.post("/get_user_wishes")
async def get_user_wishes(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select 
                uw.id, 
                uw.name, 
                uw.description,
                uw.link, 
                uw.price, 
                uw.currency,
                uw.image, 
                uw.is_booked, 
                uw.booked_by,
                uw.tg_user_id, 
                u.tg_username, 
                u.tg_first_name,
                u.tg_profile_photo, 
                c.tg_chat_name,
                c.tg_chat_photo
            from users_wishes uw
            join permissions p on uw.tg_user_id = p.tg_user_id
            join users u on uw.tg_user_id = u.tg_user_id
            join chats c on c.tg_chat_id = p.tg_chat_id
            where p.tg_chat_id = {res["chat_id"]}
            and p.tg_user_id = {res["user_id"]}
            and not uw.is_deleted
            order by u.id, uw.is_booked, uw.id desc
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
        return JSONResponse(content=data)


@app.post("/get_user_chats")
async def get_user_chats(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select 
                c.id,
                c.tg_chat_id,
                c.tg_chat_name,
                c.tg_chat_photo
            from chats c
            join permissions p on c.tg_chat_id = p.tg_chat_id
            where p.tg_user_id = {res["user_id"]}
            and p.tg_chat_id != {res["user_id"]}
            and not p.is_deleted
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
        return JSONResponse(content=data)


@app.post("/add_wish")
async def add_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            insert into users_wishes (
                tg_user_id, 
                name, 
                description, 
                link, 
                image, 
                price, 
                currency
            )
            values (
                {res["tg_user_id"]}, 
                {f"'{res['wish']['name']}'" if res["wish"]["name"] else "NULL"},
                {f"'{res['wish']['description']}'" if res["wish"]["description"] else "NULL"}, 
                {f"'{res['wish']['link']}'" if res["wish"]["link"] else "NULL"}, 
                {f"'{res['wish']['image']}'" if res["wish"]["image"] else "NULL"}, 
                {f"'{res['wish']['price']}'" if res["wish"]["price"] else "NULL"}, 
                {f"'{res['wish']['currency']}'" if res["wish"]["currency"] else "NULL"}
            ); 
        """)
        conn.commit()
    return JSONResponse(
        content={
            "status": "success"
        }
    )


@app.post("/edit_wish")
async def edit_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
        update users_wishes 
            set name = {f"'{res['wish']['name']}'" if res["wish"]["name"] else "NULL"}, 
                description = {f"'{res['wish']['description']}'" if res["wish"]["description"] else "NULL"}, 
                link = {f"'{res['wish']['link']}'" if res["wish"]["link"] else "NULL"}, 
                image = {f"'{res['wish']['image']}'" if res["wish"]["image"] else "NULL"}, 
                price = {f"'{res['wish']['price']}'" if res["wish"]["price"] else "NULL"},
                currency = {f"'{res['wish']['currency']}'" if res["wish"]["currency"] else "NULL"}
        where id = {res["wish"]["id"]}
        ; 
        """)
        conn.commit()
    return JSONResponse(
        content={
            "status": "success"
        }
    )


@app.post("/book")
async def book(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_booked = True,
                booked_by = {res["tg_user_id"]}
            where id = {res["wish_id"]}
           ; 
        """)
        conn.commit()
    return JSONResponse(
        content={
            "status": "success"
        }
    )


@app.post("/unbook")
async def unbook(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_booked = False,
                booked_by = null
            where id = {res["wish_id"]}
           ; 
        """)
        conn.commit()
    return JSONResponse(
        content={
            "status": "success"
        }
    )


@app.post("/delete")
async def delete(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_deleted = True
            where id = {res["wish_id"]}
           ;
        """)
        conn.commit()
    return JSONResponse(
        content={
            "status": "success"
        }
    )


@app.get("/new")
async def new(request: Request, wish_id: int = -1):
    return templates.TemplateResponse("new_wish.html", {"request": request, "wish_id": wish_id})


@app.post("/get_wish")
async def get_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return JSONResponse(
            content={
                "status": "failed",
                "data": {
                    "message": "You do not have permissions to see this view."
                }
            }
        )
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
        select 
            uw.id, 
            uw.name, 
            uw.description,
            uw.link, 
            uw.price, 
            uw.currency,
            uw.image
        from users_wishes uw
        where uw.id = {res["wish_id"]} 
        ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()][0]
        return JSONResponse(
            content=data
        )


@app.get("/user_wishes")
async def user_wishes(request: Request, user_id: int, chat_id: float):
    return templates.TemplateResponse("user_wishes.html", {"request": request, "user_id": user_id, "chat_id": chat_id})


@app.post("/verify_data")
async def verify_data(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if init_data == '' or init_data is None:
        return JSONResponse(
            content={
                "status": "failed",
                "data": False
            }
        )
    init_data_sorted = '\n'.join(sorted(unquote(init_data).split('&')[:-1]))
    res_hash = re.findall("hash=(\w+)", init_data)[0]

    secret_key = hmac.new(
        "WebAppData".encode(),
        msg=os.environ.get("TOKEN").encode(),
        digestmod=hashlib.sha256
    ).digest()

    data_check_string = hmac.new(
        secret_key,
        msg=init_data_sorted.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    if data_check_string != res_hash:
        return JSONResponse(
            content={
                "status": "failed",
                "data": False
            }
        )
    else:
        return JSONResponse(
            content={
                "status": "success",
                "data": True
            }
        )

