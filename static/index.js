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
    Telegram.WebApp.disableClosingConfirmation();
    const initData = Telegram.WebApp.initDataUnsafe;
    const chat_type = initData.chat_type;
    Telegram.WebApp.expand();
    const response = await get_wishes(initData);
    const res = await response.json();
    const data = await JSON.parse(res);
    const wishes = await data.data;
    if (wishes.length === 0) {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "You are not a member of this chat<br>or<br>You did not /grant access to your wishes yet";
        document.body.appendChild(alert);
    } else {
        document.getElementById("topBar").classList.remove("hidden");
        document.getElementById("topBar").classList.add("topBar");
        const users = uniqueUsers(wishes);
        const chat = uniqueChats(wishes);

        let titleText = initData.user.first_name ? initData.user.first_name : initData.user.username;
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
            if (chat[0].tg_chat_photo != null) {
                let img = document.createElement("img");
                img.src = "data:image/png;base64," + chat[0].tg_chat_photo;
                chatPhoto.appendChild(img);
            }
        } else {
            let userPhoto = document.getElementById("chat-photo");
            if (chat[0].tg_profile_photo != null) {
                let img = document.createElement("img");
                img.src = "data:image/png;base64," + chat[0].tg_profile_photo;
                userPhoto.appendChild(img);
            }
        }
        document.getElementById("title").textContent = titleText;

        let cardsContainer = document.createElement("div");
        cardsContainer.id = "cards-container";
        cardsContainer.classList.add("grid-view");
        document.body.appendChild(cardsContainer);

        if (initData.user.id === chat_id && initData.user.id === users[0].tg_user_id) {
            for (let i = 0; i < wishes.length; i++) {

                let wish = wishes[i];
                let card = document.createElement("div");
                card.classList.add("card");
                card.classList.add("active");
                cardsContainer.appendChild(card);

                let wishInfo = document.createElement("div");
                wishInfo.className = "wish-info";
                card.appendChild(wishInfo);

                let title = document.createElement("div");
                title.className = "wish-title";
                title.textContent = wish["name"];
                wishInfo.appendChild(title);

                let price = document.createElement("div");
                price.className = "price";
                price.textContent = priceFormat(wish["price"]) + " " + wish["currency"];
                wishInfo.appendChild(price);

                if (wish["image"] != null) {
                    let wishPhoto = document.createElement("div");
                    wishPhoto.className = "wish-image";
                    card.appendChild(wishPhoto);

                    let wishPhotoImg = document.createElement("img");
                    wishPhotoImg.src = wish["image"];
                    wishPhoto.appendChild(wishPhotoImg);
                }

                let bottomBar = document.createElement("div");
                bottomBar.className = "bottom-bar";
                card.appendChild(bottomBar);

                let bookMark = document.createElement("div");
                bookMark.className = "bookmark";
                bottomBar.appendChild(bookMark);
                let deleteIcon = document.createElement("span");
                deleteIcon.classList.add("material-symbols-outlined");
                deleteIcon.textContent = "delete";
                bookMark.appendChild(deleteIcon);

                bookMark.addEventListener("click", function () {
                    Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
                    Telegram.WebApp.showConfirm(
                        "Are you sure you want to delete this wish?",
                        async function (is_ok) {
                            if (is_ok) {
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
                                );
                                bookMark.parentElement.parentElement.remove();
                            }
                        }
                    )
                });

                let editWish = document.createElement("div");
                editWish.className = "bookmark";
                editWish.onclick = function () {
                    location.href="/new?wish_id=" + wish["id"];
                };
                bottomBar.appendChild(editWish);
                let editIcon = document.createElement("span");
                editIcon.classList.add("material-symbols-outlined");
                editIcon.textContent = "edit";
                editWish.appendChild(editIcon);

                if (wish["link"] != null) {
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

                let header = document.createElement("div");
                header.className = "card-header";
                card.appendChild(header);

                let userPhoto = document.createElement("div");
                userPhoto.className = "user-photo";
                header.appendChild(userPhoto);

                if (user_wishes[0].tg_profile_photo != null) {
                    let userPhotoImg = document.createElement("img");
                    userPhotoImg.src = "data:image/png;base64," + user_wishes[0].tg_profile_photo;
                    userPhoto.appendChild(userPhotoImg);
                }

                let userInfo = document.createElement("div");
                userInfo.className = "user-info";
                header.appendChild(userInfo);

                let userName = document.createElement("div");
                userName.className = "card-title";
                userName.textContent = user_wishes[0].tg_first_name ? user_wishes[0].tg_first_name : user_wishes[0].tg_username;
                userInfo.appendChild(userName);

                let wishCount = document.createElement("div");
                wishCount.className = "wish-count";
                wishCount.textContent = user_wishes_count + "\nwish";
                wishCount.textContent += user_wishes_count>1 ? "es" : "";
                userInfo.appendChild(wishCount);
            }
        }
    }

}


async function load_user_wishes() {
    Telegram.WebApp.ready();
    Telegram.WebApp.disableClosingConfirmation();
    const initData = Telegram.WebApp.initDataUnsafe;
    const chat_type = initData.chat_type;
    Telegram.WebApp.expand();
    const response = await get_user_wishes(user_id, chat_id);
    const res = await response.json();
    const data = await JSON.parse(res);
    const wishes = await data.data;
    const user = uniqueUsers(wishes);
    const chat = uniqueChats(wishes);

    let titleText = user[0].tg_first_name ? user[0].tg_first_name : user[0].tg_username;
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

        let wishInfo = document.createElement("div");
            wishInfo.className = "wish-info";
            card.appendChild(wishInfo);

            let title = document.createElement("div");
            title.className = "wish-title";
            title.textContent = wish["name"];
            wishInfo.appendChild(title);

            let price = document.createElement("div");
            price.className = "price";
            price.textContent = priceFormat(wish["price"]) + " " + wish["currency"];
            wishInfo.appendChild(price);

            if (wish["image"] != null) {
                let wishPhoto = document.createElement("div");
                wishPhoto.className = "wish-image";
                card.appendChild(wishPhoto);

                let wishPhotoImg = document.createElement("img");
                wishPhotoImg.src = wish["image"];
                wishPhoto.appendChild(wishPhotoImg);
            }

        let bottomBar = document.createElement("div");
        bottomBar.className = "bottom-bar";
        card.appendChild(bottomBar);

        if (wish["tg_user_id"] === initData.user.id) {
            let bookMark = document.createElement("div");
            bookMark.className = "bookmark";
            bottomBar.appendChild(bookMark);

            let deleteIcon = document.createElement("span");
            deleteIcon.classList.add("material-symbols-outlined");
            deleteIcon.textContent = "delete";
            bookMark.appendChild(deleteIcon);
            bookMark.parentElement.parentElement.classList.add("active");

            bookMark.addEventListener("click", async function () {
                Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
                Telegram.WebApp.showConfirm(
                    "Are you sure you want to delete this wish?",
                    async function (is_ok) {
                        if (is_ok) {
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
                            );
                            bookMark.parentElement.parentElement.remove();
                        }
                    });
            });

            let editWish = document.createElement("div");
            editWish.className = "bookmark";
            editWish.onclick = function () {
                location.href="/new?wish_id=" + wish["id"];
            };
            bottomBar.appendChild(editWish);
            let editIcon = document.createElement("span");
            editIcon.classList.add("material-symbols-outlined");
            editIcon.textContent = "edit";
            editWish.appendChild(editIcon);

        } else if (wish["is_booked"] === false || (wish["is_booked"] === true && wish["booked_by"] === initData.user.id)) {
            let bookMark = document.createElement("div");
            bookMark.className = "bookmark";
            bottomBar.appendChild(bookMark);

            let bookIcon = document.createElement("span");
            bookIcon.classList.add("material-symbols-outlined");
            bookMark.appendChild(bookIcon);
            if (wish["is_booked"] === false) {
                bookIcon.textContent = "hand_gesture";
                bookMark.parentElement.parentElement.classList.add("active");
            } else {
                bookIcon.textContent = "do_not_touch";
                bookMark.parentElement.parentElement.classList.add("booked");
            }

            bookMark.addEventListener("click", async function () {
                if (wish["is_booked"] === false) {
                    Telegram.WebApp.HapticFeedback.notificationOccurred("success");
                    await fetch(
                        "/book",
                        {
                            method: "POST",
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                wish_id: wish["id"],
                                tg_user_id: initData.user.id
                            })
                        }
                    );
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
                    );
                    wish["is_booked"] = false;
                    bookMark.parentElement.parentElement.classList.remove("booked");
                    bookMark.parentElement.parentElement.classList.add("active");
                    bookMark.getElementsByTagName("span")[0].textContent = "hand_gesture";
                }
            });
        } else if (wish["is_booked"] === true && wish["booked_by"] !== initData.user.id) {
            bottomBar.parentElement.classList.add("booked");
        }

        if (wish["link"] != null) {
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

async function get_wish(wish_id) {
    return await fetch(
        "/get_wish",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                wish_id: wish_id
            })
        }
    );
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


async function load_new_wish() {
    console.log(wish_id);
    if (wish_id !== null) {
        const response = await get_wish(wish_id);
        const res = await response.json();
        const data = await JSON.parse(res);
        const wish = await data.data;

        document.getElementById("wish-title").value = wish["name"];
        document.getElementById("wish-description").value = wish["description"];
        document.getElementById("wish-link").value = wish["link"];
        document.getElementById("wish-image-link").value = wish["image"];
        document.getElementById("wish-price").value = wish["price"];
        document.getElementById("wish-currency").value = wish["currency"];
        document.getElementById("button").textContent = "Edit";
        document.getElementById("button").onclick = function () {edit_wish(wish_id);};
    } else {
        document.getElementById("button").textContent = "Add";
        document.getElementById("button").onclick = function () {add_wish();};
    }

    let inputs = Array.prototype.slice.call(document.querySelectorAll("input[data-index]"));
    inputs.forEach(function (input) {
        document.addEventListener("click", function (event) {
           if (event.target !== input) {
               input.blur();
           }
        });
    });
    let inputCount = inputs.reduce((prev, curr) => curr > prev ? curr.getAttribute("data-index") : prev.getAttribute("data-index"));
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
    let description = document.getElementById("wish-description").value;
    let link = document.getElementById("wish-link").value;
    let imageLink = document.getElementById("wish-image-link").value;
    let price = document.getElementById("wish-price").value;
    let currency = document.getElementById("wish-currency").value;

    Telegram.WebApp.HapticFeedback.notificationOccurred("success");

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
                description: description,
			    link: link,
                image_link: imageLink,
			    price: price,
                currency: currency,
		    })
	    }
    );
    window.location.href="/?tgWebAppStartParam="+initData.start_param;
}

async function edit_wish(id) {
    let initData = Telegram.WebApp.initDataUnsafe;
    let name = document.getElementById("wish-title").value;
    let description = document.getElementById("wish-description").value;
    let link = document.getElementById("wish-link").value;
    let imageLink = document.getElementById("wish-image-link").value;
    let price = document.getElementById("wish-price").value;
    let currency = document.getElementById("wish-currency").value;

    Telegram.WebApp.HapticFeedback.notificationOccurred("success");

    await fetch(
	    "/edit_wish",
	    {
		    method: "POST",
		    headers: {
			    "Accept": "application/json",
			    "Content-Type": "application/json"
		    },
		    body: JSON.stringify({
                id: id,
			    name: name,
                description: description,
			    link: link,
                image_link: imageLink,
			    price: price,
                currency: currency,
		    })
	    }
    );
    window.location.replace(document.referrer);
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

function imageExists(image_url){
    let http = new XMLHttpRequest();
    http.open('HEAD', image_url, false);
    http.send();
    return http.status !== 404;
}