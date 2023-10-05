import os
import json
from typing import Union
from fastapi import FastAPI, Depends
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from fastapi.staticfiles import StaticFiles
import psycopg2
from dotenv import load_dotenv

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
async def index(request: Request, chat_id: float):
    print(chat_id)
    return templates.TemplateResponse("index.html", {"chat_id": chat_id})


@app.post("/get_wishes")
async def get_wishes(request: Request):
    res = await request.json()
    print(f"data: {res}")
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            select uw.id, uw.name, uw.link, uw.price, uw.currency, uw.is_booked, uw.tg_user_id, u.tg_username, u.tg_first_name
            from users_wishes uw
            join permissions p on uw.tg_user_id = p.tg_user_id
            join users u on uw.tg_user_id = u.tg_user_id
            where p.tg_chat_id in ({res["chat_id"]}, {res["user_id"]})
            and not is_deleted
            order by is_booked
            ;
        """)
        data = [dict((cur.description[i][0], value) for i, value in enumerate(row)) for row in cur.fetchall()]
        return json.dumps({"status": "ok", "data": data})



@app.post("/add_wish")
async def add_wish(request: Request):
    data = await request.json()
    print(data)
    with psycopg2.connect(**con) as conn:
        cur = conn.cursor()
        cur.execute(f"""
            insert into users_wishes (tg_user_id, name, link, price)
          values ({data["tg_user_id"]}, '{data["name"]}', '{data["link"]}', '{data["price"]}')
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
            set is_booked = True
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


@app.get("/new")
async def new(request: Request):
    return templates.TemplateResponse("new_wish.html", {"request": request})

