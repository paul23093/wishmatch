import os
import json
import re
from typing import Union
from fastapi import FastAPI, Depends
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from fastapi.staticfiles import StaticFiles
import psycopg2
from dotenv import load_dotenv
import hmac
import hashlib

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


@app.post("/verify_data")
async def verify_data(request: Request):
    res = request.content
    res_hash = re.compile("hash=(\w+)", res)[0]
    secret_key = hmac.new(
        bytes(os.environ.get("TOKEN"), 'latin-1'),
        msg=bytes("WebAppData", 'latin-1'),
        digestmod=hashlib.sha256
    ).hexdigest().upper()

    data_check_string = hmac.new(
        bytes(res, 'latin-1'),
        msg=bytes(secret_key, 'latin-1'),
        digestmod=hashlib.sha256
    ).hexdigest().upper()

    if hex(data_check_string) == res_hash:
        result = "VERIFIED"
    else:
        result = "NOT VERIFIED"
    print(result)
    return json.dumps({"request": request, "result": result})


@app.post("/get_wishes")
async def get_wishes(request: Request):
    res = await request.json()
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
        return json.dumps({"status": "ok", "data": data})


@app.post("/get_user_wishes")
async def get_user_wishes(request: Request):
    res = await request.json()
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
        return json.dumps({"status": "ok", "data": data})


@app.post("/add_wish")
async def add_wish(request: Request):
    data = await request.json()
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
                {data["tg_user_id"]}, 
                {f"'{data['name']}'" if data["name"] else "NULL"},
                {f"'{data['description']}'" if data["description"] else "NULL"}, 
                {f"'{data['link']}'" if data["link"] else "NULL"}, 
                {f"'{data['image_link']}'" if data["image_link"] else "NULL"}, 
                {f"'{data['price']}'" if data["price"] else "NULL"}, 
                {f"'{data['currency']}'" if data["currency"] else "NULL"}
            ); 
        """)
        conn.commit()
    response = {"status": "ok"}
    return response


@app.post("/edit_wish")
async def edit_wish(request: Request):
    data = await request.json()
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
        update users_wishes 
            set name = {f"'{data['name']}'" if data["name"] else "NULL"}, 
                description = {f"'{data['description']}'" if data["description"] else "NULL"}, 
                link = {f"'{data['link']}'" if data["link"] else "NULL"}, 
                image = {f"'{data['image_link']}'" if data["image_link"] else "NULL"}, 
                price = {f"'{data['price']}'" if data["price"] else "NULL"},
                currency = {f"'{data['currency']}'" if data["currency"] else "NULL"}
        where id = {data["id"]}
        ; 
        """)
        conn.commit()
    response = {"status": "ok"}
    return response


@app.post("/book")
async def book(request: Request):
    data = await request.json()
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_booked = True,
            booked_by = {data["tg_user_id"]}
            where id = {data["wish_id"]}
           ; 
        """)
        conn.commit()
    response = {"status": "ok"}
    return response


@app.post("/unbook")
async def unbook(request: Request):
    data = await request.json()
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_booked = False
            where id = {data["wish_id"]}
           ; 
        """)
        conn.commit()
    response = {"status": "ok"}
    return response


@app.post("/delete")
async def delete(request: Request):
    data = await request.json()
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_deleted = True
            where id = {data["wish_id"]}
           ; 
        """)
        conn.commit()
    response = {"status": "ok"}
    return response


@app.get("/new")
async def new(request: Request, wish_id: int = -1):
    return templates.TemplateResponse("new_wish.html", {"request": request, "wish_id": wish_id})


@app.post("/get_wish")
async def get_wish(request: Request):
    data = await request.json()
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
        where uw.id = {data["wish_id"]} 
        ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()][0]

        return json.dumps({"status": "ok", "data": data})


@app.get("/user_wishes")
async def user_wishes(request: Request, user_id: int, chat_id: float):
    return templates.TemplateResponse("user_wishes.html", {"request": request, "user_id": user_id, "chat_id": chat_id})
