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


@app.post("/get_wishes")
async def get_wishes(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
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
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
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
        return json.dumps({"status": "success", "data": data})


@app.post("/add_wish")
async def add_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
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
                {f"'{res['name']}'" if res["name"] else "NULL"},
                {f"'{res['description']}'" if res["description"] else "NULL"}, 
                {f"'{res['link']}'" if res["link"] else "NULL"}, 
                {f"'{res['image_link']}'" if res["image_link"] else "NULL"}, 
                {f"'{res['price']}'" if res["price"] else "NULL"}, 
                {f"'{res['currency']}'" if res["currency"] else "NULL"}
            ); 
        """)
        conn.commit()
    return json.dumps({"status": "success"})


@app.post("/edit_wish")
async def edit_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
        update users_wishes 
            set name = {f"'{res['name']}'" if res["name"] else "NULL"}, 
                description = {f"'{res['description']}'" if res["description"] else "NULL"}, 
                link = {f"'{res['link']}'" if res["link"] else "NULL"}, 
                image = {f"'{res['image_link']}'" if res["image_link"] else "NULL"}, 
                price = {f"'{res['price']}'" if res["price"] else "NULL"},
                currency = {f"'{res['currency']}'" if res["currency"] else "NULL"}
        where id = {res["id"]}
        ; 
        """)
        conn.commit()
    return json.dumps({"status": "success"})


@app.post("/book")
async def book(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
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
    return json.dumps({"status": "success"})


@app.post("/unbook")
async def unbook(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_booked = False
            where id = {res["wish_id"]}
           ; 
        """)
        conn.commit()
    return json.dumps({"status": "success"})


@app.post("/delete")
async def delete(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            update users_wishes
            set is_deleted = True
            where id = {res["wish_id"]}
           ; 
        """)
        conn.commit()
    return json.dumps({"status": "success"})


@app.get("/new")
async def new(request: Request, wish_id: int = -1):
    return templates.TemplateResponse("new_wish.html", {"request": request, "wish_id": wish_id})


@app.post("/get_wish")
async def get_wish(request: Request):
    res = await request.json()
    init_data = res["init_data"]
    if not is_data_verified(init_data):
        return json.dumps({"status": "failed", "data": {"message": "You do not have permissions to see this view."}})
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
        return json.dumps({"status": "success", "data": data})


@app.get("/user_wishes")
async def user_wishes(request: Request, user_id: int, chat_id: float):
    return templates.TemplateResponse("user_wishes.html", {"request": request, "user_id": user_id, "chat_id": chat_id})


@app.post("/verify_data")
async def verify_data(request: Request):
    res = await request.json()
    init_data = res["init_data"]
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
