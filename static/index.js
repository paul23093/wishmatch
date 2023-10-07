function switchView() {
    let button = document.getElementById("view-button");
    let container = document.getElementById("cards-container");
    if (container.className === "grid-view") {
        container.className = "list-view";
        button.textContent = "view_agenda"
    } else {
        container.className = "grid-view";
        button.textContent = "grid_view"
    }
}

async function load() {
    Telegram.WebApp.ready();
    Telegram.WebApp.enableClosingConfirmation();
    const initData = Telegram.WebApp.initDataUnsafe;
    const chat_type = initData.chat_type;
    Telegram.WebApp.expand();
    const response = await get_wishes(initData);
    const res = await response.json();
    const data = await JSON.parse(res);
    const wishes = await data.data;
    const users = uniqueUsers(wishes);
    const chat = uniqueChats(wishes);


    let titleText = initData.user.first_name;
    if (["group", "supergroup"].includes(chat_type)) {
        titleText = chat[0].tg_chat_name;
        let subtitleText = users.length + " user";
        if (users.length > 1) {
            subtitleText += "s";
        }
        let subtitle = document.getElementById("subtitle");
        subtitle.textContent = subtitleText;
        subtitle.style.display = "flex";

        let chatPhoto = document.getElementById("chat-photo");
        let img = document.createElement("img");
        img.src = "data:image/png;base64," + chat[0].tg_chat_photo;
        chatPhoto.appendChild(img);
    } else {
        let userPhoto = document.getElementById("chat-photo");
        let img = document.createElement("img");
        img.src = "data:image/png;base64," + chat[0].tg_profile_photo;
        userPhoto.appendChild(img);
    }
    document.getElementById("title").textContent = titleText;

    if (user_id === chat_id) {
        for (let i = 0; i < wishes.length; i++) {
            let wish = wishes[i];
            let card = document.createElement("div");
            card.classList.add("card");
            let div = document.getElementById("cards-container");
            div.appendChild(card);

            let title = document.createElement("div");
            title.className = "card-title";
            title.textContent = wish["name"];
            card.appendChild(title);

            let price = document.createElement("div");
            price.className = "price";
            price.textContent = priceFormat(wish["price"]) + " " + wish["currency"];
            card.appendChild(price);

            let bottomBar = document.createElement("div");
            bottomBar.className = "bottom-bar";
            card.appendChild(bottomBar);

            let bookMark = document.createElement("div");
            bookMark.className = "bookmark";
            bottomBar.appendChild(bookMark);
            if (wish["is_deleted"] === false) {
                let deleteIcon = document.createElement("span");
                deleteIcon.classList.add("material-symbols-outlined");
                deleteIcon.textContent = "delete";
                bookMark.appendChild(deleteIcon);
                bookMark.parentElement.parentElement.classList.add("active");
            }

            bookMark.addEventListener("click", async function () {
                if (wish["is_deleted"] === false) {
                    await fetch(
                        "/delete",
                        {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                wish_id: wish["id"]
                            })
                        }
                    )
                    wish["is_deleted"] = true;
                    bookMark.parentElement.parentElement.remove();
                }
            });

            let link = document.createElement("div");
            link.className = "link";
            let linkIcon = document.createElement("span");
            linkIcon.classList.add("material-symbols-outlined");
            linkIcon.textContent = "open_in_new";
            link.appendChild(linkIcon);
            link.onclick = function () {
                window.open(wish["link"]);
            }
            bottomBar.appendChild(link);
        }
    }
    else {
        for (let j=0; j<users.length; j++) {
            const user_wishes = wishes.filter(function (wish) {
                return wish["tg_user_id"] === users[j].tg_user_id
            });
            const user_wishes_count = user_wishes.length;

            let card = document.createElement("div");
            card.classList.add("card");
            card.classList.add("clickable");
            card.classList.add("active");
            card.onclick = function () {
                location.href = "/user_wishes?user_id=" + users[j].tg_user_id + "&chat_id=" + chat[0].tg_chat_id;
            };
            let div = document.getElementById("cards-container");
            div.appendChild(card);

            let title = document.createElement("div");
            title.className = "card-title";
            title.textContent = user_wishes[0].tg_first_name;
            card.appendChild(title);

            let price = document.createElement("div");
            price.className = "wish-count";
            price.textContent = user_wishes_count + "\nwish";
            price.textContent += user_wishes_count>1 ? "es" : "";
            card.appendChild(price);
        }
    }
}


async function load_user_wishes() {
    Telegram.WebApp.ready();
    Telegram.WebApp.enableClosingConfirmation();
    const initData = Telegram.WebApp.initDataUnsafe;
    const chat_type = initData.chat_type;
    Telegram.WebApp.expand();
    const response = await get_user_wishes(user_id, chat_id);
    const res = await response.json();
    const data = await JSON.parse(res);
    const wishes = await data.data;
    const user = uniqueUsers(wishes);
    const chat = uniqueChats(wishes);

    let titleText = user[0].tg_first_name;
    let subtitleText = chat[0].tg_chat_name;

    let title = document.getElementById("title");
    title.textContent = titleText;

    let subtitle = document.getElementById("subtitle");
    subtitle.textContent = subtitleText;
    subtitle.style.display = "flex";

    for (let i = 0; i < wishes.length; i++) {
        let wish = wishes[i];
        let card = document.createElement("div");
        card.classList.add("card");
        let div = document.getElementById("cards-container");
        div.appendChild(card);

        let title = document.createElement("div");
        title.className = "card-title";
        title.textContent = wish["name"];
        card.appendChild(title);

        let price = document.createElement("div");
        price.className = "price";
        price.textContent = priceFormat(wish["price"]) + " " + wish["currency"];
        card.appendChild(price);

        let bottomBar = document.createElement("div");
        bottomBar.className = "bottom-bar";
        card.appendChild(bottomBar);

        let bookMark = document.createElement("div");
        bookMark.className = "bookmark";
        bottomBar.appendChild(bookMark);
        if (user_id !== initData.user.id) {
            if (wish["is_booked"] === false) {
                let bookIcon = document.createElement("span");
                bookIcon.classList.add("material-symbols-outlined");
                bookIcon.textContent = "hand_gesture";
                bookMark.appendChild(bookIcon);
                bookMark.parentElement.parentElement.classList.add("active");
            } else {
                let bookIcon = document.createElement("span");
                bookIcon.classList.add("material-symbols-outlined");
                bookIcon.textContent = "do_not_touch";
                bookMark.appendChild(bookIcon);
                bookMark.parentElement.parentElement.classList.add("booked");
            }
            bookMark.addEventListener("click", async function () {
                if (wish["is_booked"] === false) {
                    await fetch(
                        "/book",
                        {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                wish_id: wish["id"]
                            })
                        }
                    )
                    wish["is_booked"] = true;
                    bookMark.parentElement.parentElement.classList.remove("active");
                    bookMark.parentElement.parentElement.classList.add("booked");
                    bookMark.getElementsByTagName("span")[0].textContent = "do_not_touch";
                } else {
                    await fetch(
                        "/unbook",
                        {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                wish_id: wish["id"]
                            })
                        }
                    )
                    wish["is_booked"] = false;
                    bookMark.parentElement.parentElement.classList.remove("booked");
                    bookMark.parentElement.parentElement.classList.add("active");
                    bookMark.getElementsByTagName("span")[0].textContent = "hand_gesture";
                }
            });

        } else {
            if (wish["is_deleted"] === false) {
                let deleteIcon = document.createElement("span");
                deleteIcon.classList.add("material-symbols-outlined");
                deleteIcon.textContent = "delete";
                bookMark.appendChild(deleteIcon);
                bookMark.parentElement.parentElement.classList.add("active");
            }

            bookMark.addEventListener("click", async function () {
                if (wish["is_deleted"] === false) {
                    await fetch(
                        "/delete",
                        {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                wish_id: wish["id"]
                            })
                        }
                    )
                    wish["is_deleted"] = true;
                    bookMark.parentElement.parentElement.remove();
                }
            });
        }

        let link = document.createElement("div");
        link.className = "link";
        let linkIcon = document.createElement("span");
        linkIcon.classList.add("material-symbols-outlined");
        linkIcon.textContent = "open_in_new";
        link.appendChild(linkIcon);
        link.onclick = function () {
            window.open(wish["link"]);
        }
        bottomBar.appendChild(link);
    }
}


async function get_wishes(initData) {
    const response = await fetch(
        "/get_wishes",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: initData.user.id,
                chat_id: chat_id
            })
        }
    )
    return response;
}

async function get_user_wishes(user_id, chat_id) {
    return await fetch(
        "/get_user_wishes",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: user_id,
                chat_id: chat_id
            })
        }
    );
}


function load_new_wish() {
    let inputCount = Array.prototype.slice.call(document.querySelectorAll("input[data-index]")).reduce((prev, curr) => curr > prev ? curr.getAttribute("data-index") : prev.getAttribute("data-index"));
    addEventListener("keydown", (event) => {
        if (event.code === "Enter") {
            event.preventDefault();
            const index = parseInt(event.target.getAttribute("data-index"));
            if (index < inputCount) {
                document.querySelector('[data-index="' + (index+1) + '"]').focus();
            }
        }
    });

    document.querySelector('[data-index="' + inputCount + '"]').addEventListener('keydown', (event) => {
        if (event.code === 'Enter') {
            event.target.blur();
        }
    });
}

async function add_wish() {
    let initData = Telegram.WebApp.initDataUnsafe;
    let tg_user_id = initData.user.id;
    let name = document.getElementById("wish-title").value;
    let link = document.getElementById("wish-link").value;
    let price = document.getElementById("wish-price").value;
    let currency = document.getElementById("wish-currency").value;

    await fetch(
	    "/add_wish",
	    {
		    method: "POST",
		    headers: {
			    "Accept": "application/json",
			    "Content-Type": "application/json"
		    },
		    body: JSON.stringify({
			    tg_user_id: tg_user_id, 
			    name: name, 
			    link: link, 
			    price: price,
                currency: currency
		    })
	    }
    );
    window.location.href="/?tgWebAppStartParam="+initData.start_param;
}

function back() {
    let initData = Telegram.WebApp.initDataUnsafe;
    window.location.href="/?tgWebAppStartParam="+initData.start_param;
}

function priceFormat(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function uniqueUsers(wishes) {
    const uniqueUserIds = {};
    return wishes.filter(obj => {
        if (!uniqueUserIds[obj.tg_user_id]) {
            uniqueUserIds[obj.tg_user_id] = true;
            return true;
        }
        return false;
    });
}

function uniqueChats(wishes) {
    const uniqueChatIds = {};
    return wishes.filter(obj => {
        if (!uniqueChatIds[obj.tg_chat_id]) {
            uniqueChatIds[obj.tg_chat_id] = true;
            return true;
        }
        return false;
    });
}