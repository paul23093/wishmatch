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

class User {
    constructor(id, tgId, username, firstName, lastName, photoBytes) {
        this.id = id;
        this.tgId = tgId;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.photoBytes = photoBytes;
    }

    toJson() {
        return {
            "id": this.id,
            "tg_user_id": this.tgId,
            "tg_username": this.username,
            "tg_first_name": this.firstName,
            "tg_last_name": this.lastName,
            "image": this.photoBytes
        };
    }

    static from(json){
        return new User(
            json["id"],
            json["tg_user_id"],
            json["tg_username"],
            json["tg_first_name"],
            json["tg_last_name"],
            json["image"]
        );
    }
}

class ChatUser extends User {
    constructor(chatId, chatName, ...args) {
        super(...args);
        this.chatId = chatId;
        this.chatName = chatName;
    }

    toJson() {
        let jsonObj = super.toJson();
        jsonObj["chat_id"] = this.chatId;
        jsonObj["chat_name"] = this.chatName;
        return jsonObj;
    }

    static from(json){
        return new ChatUser(
            json["chat_id"],
            json["chat_name"],
            json["id"],
            json["tg_user_id"],
            json["tg_username"],
            json["tg_first_name"],
            json["tg_last_name"],
            json["image"]
        );
    }
}

class Wish {
    constructor({id=null, tgUserId, name, description, link, image, price, currency, isBooked, bookedBy}) {
        this.id = id;
        this.tgUserId = tgUserId;
        this.name = name;
        this.description = description;
        this.link = link;
        this.image = image;
        this.price = price;
        this.currency = currency;
        this.isBooked = isBooked;
        this.bookedBy = bookedBy;
    }

    toJson() {
        return {
            "id": (this.id !== null && this.id !== "") ? this.id : null,
            "tg_user_id": (this.tgUserId !== null && this.tgUserId !== "") ? this.tgUserId : null,
            "name": (this.name !== null && this.name !== "") ? this.name : null,
            "description": (this.description !== null && this.description !== "") ? this.description : null,
            "link": (this.link !== null && this.link !== "") ? this.link : null,
            "image": (this.image !== null && this.image !== "") ? this.image : null,
            "price": (this.price !== null && this.price !== "") ? this.price : null,
            "currency": (this.currency !== null && this.currency !== "") ? this.currency : null,
            "is_booked": (this.isBooked !== null && this.isBooked !== "") ? this.isBooked : null,
            "booked_by": (this.bookedBy !== null && this.bookedBy !== "") ? this.bookedBy : null
        };
    }

    static from(json){
        return new Wish({
            id: json["id"],
            tgUserId: json["tg_user_id"],
            name: json["name"],
            description: json["description"],
            link: json["link"],
            image: json["image"],
            price: json["price"],
            currency: json["currency"],
            isBooked: json["is_booked"],
            bookedBy: json["booked_by"]
        });
    }
}

function openTab(tabName, el=null) {

    let tabContent = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }

    let tabs = document.getElementsByClassName("tab");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }

    document.getElementById(tabName).style.display = "grid";
    if (el !== null) {
        el.classList.add("active");
    }
}


async function load() {
    Telegram.WebApp.ready();
    Telegram.WebApp.disableClosingConfirmation();
    Telegram.WebApp.BackButton.hide();
    const initDataRaw = Telegram.WebApp.initData;
    const initData = Telegram.WebApp.initDataUnsafe;
    const chatType = initData.chat_type;
    Telegram.WebApp.expand();
    const verification = await verifyAccess(chat_id);
    if (verification["is_access_granted"] === false) {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "You need to /grant access in this chat first";
        document.getElementById("content").appendChild(alert);
        return;
    }
    const wishes = await getChatWishes(chat_id);
    document.getElementById("topBar").classList.remove("hidden");
    document.getElementById("topBar").classList.add("topBar");
    const users = uniqueUsers(wishes);
    const chat = await getChatInfo(chat_id);

    let titleText = initData.user.first_name ? initData.user.first_name : initData.user.username;
    if (["group", "supergroup"].includes(chatType)) {
        titleText = chat.tg_chat_name;
        let subtitleText = users.length + " user";
        if (users.length > 1) {
            subtitleText += "s";
        }
        let subtitle = document.getElementById("subtitle");
        subtitle.textContent = subtitleText;
        subtitle.style.display = "flex";

        let chatPhoto = document.getElementById("chat-photo");
        if (chat.tg_chat_photo != null) {
            let img = document.createElement("img");
            img.src = "data:image/png;base64," + chat.tg_chat_photo;
            chatPhoto.appendChild(img);
        }
    } else {
        document.getElementById("tabs").hidden = false;
        document.getElementById("pageTitle").style.display = "none";
        const userInfo = await getUserInfo();
        if (userInfo != null) {
            let userPhoto = document.getElementById("chat-photo");
            if (userInfo.tg_profile_photo != null) {
                let img = document.createElement("img");
                img.src = "data:image/png;base64," + userInfo.tg_profile_photo;
                userPhoto.appendChild(img);
            }
        }
    }
    document.getElementById("title").textContent = titleText;

    if (wishes.length === 0) {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "Your wishlist is empty.<br>Add new wish by + button.";
        document.getElementById("content").appendChild(alert);
    }

    if (initData.user.id === chat_id && initData.user.id === users[0].tg_user_id) {

        await openUserWishes(wishes, "myWishes");

        let chatsContainer = document.createElement("div");
        chatsContainer.id = "chats";
        chatsContainer.classList.add("grid-view");
        chatsContainer.classList.add("tab-content");
        chatsContainer.style.display = "none";
        document.getElementById("content").appendChild(chatsContainer);

        const userChats = await getUserChats(initData.user.id);
        userChats.forEach((userChat) => {
            let chatCard = document.createElement("div");
            chatCard.classList.add("card");
            chatCard.classList.add("active");

            chatCard.addEventListener("click", async () => {
                await openChatUsers(userChat["tg_chat_id"]);
            });

            chatsContainer.appendChild(chatCard);

            let header = document.createElement("div");
            header.className = "card-header";
            chatCard.appendChild(header);

            let userPhoto = document.createElement("div");
            userPhoto.className = "user-photo";
            header.appendChild(userPhoto);

            if (userChat["tg_chat_photo"] != null) {
                let userPhotoImg = document.createElement("img");
                userPhotoImg.src = "data:image/png;base64," + userChat["tg_chat_photo"];
                userPhoto.appendChild(userPhotoImg);
            }

            let userInfo = document.createElement("div");
            userInfo.className = "user-info";
            header.appendChild(userInfo);

            let userName = document.createElement("div");
            userName.className = "card-title";
            userName.textContent = userChat["tg_chat_name"];
            userInfo.appendChild(userName);
        });
    }
    else {
        document.getElementById("tabs").style.display = "none";
        await openChatUsers(chat_id);
    }

}


async function loadUserWishes() {
    Telegram.WebApp.ready();
    Telegram.WebApp.disableClosingConfirmation();
    const initDataRaw = Telegram.WebApp.initData;
    const is_data_verified = await verifyData(initDataRaw);
    if (is_data_verified["status"] === "failed") {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = data["data"]["message"];
        document.body.appendChild(alert);
        return;
    }
    const initData = Telegram.WebApp.initDataUnsafe;
    Telegram.WebApp.BackButton.onClick(function () {
        if (initData.start_param !== initData.user.id) {
            window.location.href="/?tgWebAppStartParam="+initData.start_param;
        } else {
            window.location.href="/?tgWebAppStartParam="+initData.start_param;
        }
    });
    Telegram.WebApp.BackButton.show();
    const chat_type = initData.chat_type;
    Telegram.WebApp.expand();
    const verification = await verifyAccess(chat_id);
    if (verification["is_access_granted"] === false) {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "You need to /grant access in this chat first";
        document.body.appendChild(alert);
        return;
    }
    const wishes = await getUserWishes(user_id, chat_id);
    const user = uniqueUsers(wishes);
    const chat = uniqueChats(wishes);

    let titleText = user[0].tg_first_name ? user[0].tg_first_name : user[0].tg_username;
    let subtitleText = chat[0].tg_chat_name;

    let title = document.getElementById("title");
    title.textContent = titleText;

    let subtitle = document.getElementById("subtitle");
    subtitle.textContent = subtitleText;
    subtitle.style.display = "flex";

    let userPhoto = document.getElementById("chat-photo");
    if (chat[0].tg_profile_photo != null) {
        let img = document.createElement("img");
        img.src = "data:image/png;base64," + chat[0].tg_profile_photo;
        userPhoto.appendChild(img);
    }

    for (let i = 0; i < wishes.length; i++) {
        let wish = wishes[i];
        let card = document.createElement("div");
        card.classList.add("card");
        let div = document.getElementById("cards-container");
        div.appendChild(card);

        // card.addEventListener("click", function(event) {
        //     if (!event.target.parentNode.parentNode.classList.contains("bottom-bar") &&
        //         !event.target.parentNode.classList.contains("bottom-bar") &&
        //         !event.target.classList.contains("bottom-bar")) {
        //         openWish(Wish.from(wish));
        //     }
        // });

        let wishInfo = document.createElement("div");
            wishInfo.className = "wish-info";
            card.appendChild(wishInfo);

            let title = document.createElement("div");
            title.className = "wish-title";
            title.textContent = wish["name"];
            wishInfo.appendChild(title);

            if (wish["price"] !== null) {
                let price = document.createElement("div");
                price.className = "price";
                price.textContent = priceFormat(wish["price"]);
                if (wish["currency"] !== null) {
                    price.textContent += " " + wish["currency"];
                }
                wishInfo.appendChild(price);
            }

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
                                        init_data: initDataRaw,
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
                                init_data: initDataRaw,
                                wish_id: wish["id"],
                                tg_user_id: initData.user.id
                            })
                        }
                    );
                    wish["is_booked"] = true;
                    card.classList.remove("active");
                    card.classList.add("booked");
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
                                init_data: initDataRaw,
                                wish_id: wish["id"]
                            })
                        }
                    );
                    wish["is_booked"] = false;
                    card.classList.remove("booked");
                    card.classList.add("active");
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


async function verifyAccess(chat_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const initData = Telegram.WebApp.initDataUnsafe;
    const response = await fetch(
        "/access_verification",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                user_id: initData.user.id,
                chat_id: chat_id
            })
        }
    );
    return await response.json();
}


async function getUserInfo() {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_user_info",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                chat_id: chat_id
            })
        }
    );
    return await response.json();
}


async function getChatInfo(chat_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_chat_info",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                chat_id: chat_id
            })
        }
    );
    return await response.json();
}


async function getChatWishes(chat_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_wishes",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                user_id: Telegram.WebApp.initDataUnsafe.user.id,
                chat_id: chat_id
            })
        }
    );
    return await response.json();
}

async function getWish(wish_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_wish",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                wish_id: wish_id
            })
        }
    );
    const json = await response.json();
    return Wish.from(json);
}

async function getUserWishes(user_id, chat_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_user_wishes",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                user_id: user_id,
                chat_id: chat_id
            })
        }
    );
    return await response.json();
}


async function getUserChats(user_id) {
    const initDataRaw = Telegram.WebApp.initData;
    const response = await fetch(
        "/get_user_chats",
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                init_data: initDataRaw,
                user_id: user_id
            })
        }
    );
    return await response.json();
}


async function addWish() {
    Telegram.WebApp.MainButton.disable();
    Telegram.WebApp.MainButton.showProgress();
    const initDataRaw = Telegram.WebApp.initData;
    const is_data_verified = await verifyData(initDataRaw);
    if (is_data_verified["status"] === "failed") {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "You do not have permissions to see this view.";
        document.body.appendChild(alert);
        return;
    }
    let initData = Telegram.WebApp.initDataUnsafe;
    let tg_user_id = initData.user.id;
    let wish = new Wish({
        name: document.getElementById("wish-title").value,
        description: document.getElementById("wish-description").value,
        link: document.getElementById("wish-link").value,
        image: document.getElementById("wish-image-link").value,
        price: document.getElementById("wish-price").value,
        currency: document.getElementById("wish-currency").value
    })

    Telegram.WebApp.HapticFeedback.notificationOccurred("success");

    fetch(
	    "/add_wish",
	    {
		    method: "POST",
		    headers: {
			    "Accept": "application/json",
			    "Content-Type": "application/json"
		    },
		    body: JSON.stringify({
                init_data: initDataRaw,
			    tg_user_id: tg_user_id, 
			    wish: wish.toJson()
		    })
	    }
    ).then(function() {
        Telegram.WebApp.MainButton.hideProgress();
    });
    window.location.replace(document.referrer);
}

async function editWish(id) {
    Telegram.WebApp.MainButton.disable();
    Telegram.WebApp.MainButton.showProgress();
    const initDataRaw = Telegram.WebApp.initData;
    const is_data_verified = await verifyData(initDataRaw);
    if (is_data_verified["status"] === "failed") {
        let alert = document.createElement("span");
        alert.classList.add("page-alert");
        alert.innerHTML = "You do not have permissions to see this view.";
        document.body.appendChild(alert);
        return;
    }

    let wish = new Wish({
        id: id,
        name: document.getElementById("wish-title").value,
        description: document.getElementById("wish-description").value,
        link: document.getElementById("wish-link").value,
        image: document.getElementById("wish-image-link").value,
        price: document.getElementById("wish-price").value,
        currency: document.getElementById("wish-currency").value
    })

    Telegram.WebApp.HapticFeedback.notificationOccurred("success");

    fetch(
	    "/edit_wish",
	    {
		    method: "POST",
		    headers: {
			    "Accept": "application/json",
			    "Content-Type": "application/json"
		    },
		    body: JSON.stringify({
                init_data: initDataRaw,
			    wish: wish.toJson()
		    })
	    }
    ).then(function() {
        Telegram.WebApp.MainButton.hideProgress();
    });
    window.location.replace(document.referrer);
}

function openWish(userWish) {
    let card = document.createElement("div");
    card.className = "wish-details";
    document.body.appendChild(card);
    let header = document.createElement("div");
    header.className = "wish-details-header";
    card.appendChild(header);

    let content = document.getElementById("content");
    content.style.display = "none";

    let wishImage = document.createElement("img");
    wishImage.className = "wish-details-image";
    wishImage.src = userWish.image;
    header.appendChild(wishImage);

    let wishInfo = document.createElement("div");
    wishInfo.className = "wish-details-info";
    header.appendChild(wishInfo);

    let wishTitle = document.createElement("div");
    wishTitle.className = "wish-details-info-title";
    wishTitle.innerText = userWish.name;
    wishInfo.appendChild(wishTitle);

    let wishPrice = document.createElement("div");
    wishPrice.className = "wish-details-info-price";
    wishPrice.innerText = priceFormat(userWish.price) + " " + userWish.currency;
    wishInfo.appendChild(wishPrice);

    let wishDesc = document.createElement("div");
    wishDesc.className = "wish-details-desc";
    card.appendChild(wishDesc);

    let wishDescLabel = document.createElement("div");
    wishDescLabel.className = "wish-details-desc-label";
    wishDescLabel.innerText = "Description";
    wishDesc.appendChild(wishDescLabel);

    let wishDescContent = document.createElement("div");
    wishDescContent.innerText = userWish.description;
    wishDesc.appendChild(wishDescContent);

    buildBottomBar(userWish, card, true);

    Telegram.WebApp.BackButton.onClick(function () {
        content.style.display = "block";
        card.remove();
        Telegram.WebApp.BackButton.hide();
    });
    Telegram.WebApp.BackButton.show();
}

function buildBottomBar(wish, card, showLabels=false) {
    let initData = Telegram.WebApp.initDataUnsafe;
    let initDataRaw = Telegram.WebApp.initData;
    let bottomBar = document.createElement("div");
    bottomBar.className = "bottom-bar";
    card.appendChild(bottomBar);

    if (wish.tgUserId === initData.user.id) {
        let bookMark = document.createElement("div");
        bookMark.className = "bookmark";
        bottomBar.appendChild(bookMark);
        let deleteIcon = document.createElement("span");
        deleteIcon.classList.add("material-symbols-outlined");
        deleteIcon.textContent = "delete";
        bookMark.appendChild(deleteIcon);
        if (showLabels) {
            let deleteLabel = document.createElement("span");
            deleteLabel.className = "button-label";
            deleteLabel.textContent = "Delete";
            bookMark.appendChild(deleteLabel);
        }

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
                                    init_data: initDataRaw,
                                    wish_id: wish.id
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
            buildWishForm(wish);
        };
        bottomBar.appendChild(editWish);
        let editIcon = document.createElement("span");
        editIcon.classList.add("material-symbols-outlined");
        editIcon.textContent = "edit";
        editWish.appendChild(editIcon);
        if (showLabels) {
            let editLabel = document.createElement("span");
            editLabel.className = "button-label";
            editLabel.textContent = "Edit";
            editWish.appendChild(editLabel);
        }
    } else if (wish.isBooked === false || (wish.isBooked === true && wish.bookedBy === initData.user.id)) {
        let bookMark = document.createElement("div");
        bookMark.className = "bookmark";
        bottomBar.appendChild(bookMark);

        let bookIcon = document.createElement("span");
        bookIcon.classList.add("material-symbols-outlined");
        bookMark.appendChild(bookIcon);
        if (wish.isBooked === false) {
            bookIcon.textContent = "hand_gesture";
            bookMark.parentElement.parentElement.classList.add("active");
            if (showLabels) {
                let deleteLabel = document.createElement("span");
                deleteLabel.className = "button-label";
                deleteLabel.textContent = "Book";
                bookMark.appendChild(deleteLabel);
            }
        } else {
            bookIcon.textContent = "do_not_touch";
            bookMark.parentElement.parentElement.classList.add("booked");
            if (showLabels) {
                let deleteLabel = document.createElement("span");
                deleteLabel.className = "button-label";
                deleteLabel.textContent = "Unbook";
                bookMark.appendChild(deleteLabel);
            }
        }

        bookMark.addEventListener("click", async function () {
            if (wish.isBooked === false) {
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
                            init_data: initDataRaw,
                            wish_id: wish.id,
                            tg_user_id: initData.user.id
                        })
                    }
                );
                wish.isBooked = true;
                card.classList.remove("active");
                card.classList.add("booked");
                bookMark.querySelector("span[class='material-symbols-outlined']").textContent = "do_not_touch";
                bookMark.querySelector("span[class='button-label']").textContent = "Unbook";
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
                            init_data: initDataRaw,
                            wish_id: wish.id
                        })
                    }
                );
                wish.isBooked = false;
                card.classList.remove("booked");
                card.classList.add("active");
                bookMark.querySelector("span[class='material-symbols-outlined']").textContent = "hand_gesture";
                bookMark.querySelector("span[class='button-label']").textContent = "Book";
            }
        });
    } else if (wish.isBooked === true && wish.bookedBy !== initData.user.id) {
        bottomBar.parentElement.classList.add("booked");
    }

    if (wish.link != null) {
        let link = document.createElement("div");
        link.className = "bookmark";
        let linkIcon = document.createElement("span");
        linkIcon.classList.add("material-symbols-outlined");
        linkIcon.textContent = "open_in_new";
        link.appendChild(linkIcon);
        if (showLabels) {
            let linkLabel = document.createElement("span");
            linkLabel.className = "button-label";
            linkLabel.textContent = "Link";
            link.appendChild(linkLabel);
        }
        link.onclick = function () {
            window.open(wish.link);
        }
        bottomBar.appendChild(link);
    }
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

function adjustScroll() {
    const body = document.body;
    const keyboardHeight = window.innerHeight - document.documentElement.clientHeight;
    if (keyboardHeight > 0) {
        const inputField = document.activeElement;
        const inputFieldRect = inputField.getBoundingClientRect();
        const scrollTop = inputFieldRect.bottom - window.innerHeight + keyboardHeight;

        body.scrollTop = scrollTop;
    } else {
        body.scrollTop = 0;
    }
}

function checkInput(e) {
    let el = e.target;
    if (el.value !== null && el.value !== "") {
        el.nextElementSibling.className = "visible";
        if (el.id === "wish-title") {
            Telegram.WebApp.MainButton.enable();
        }
    } else {
        el.nextElementSibling.className = "hidden";
        if (el.id === "wish-title") {
            Telegram.WebApp.MainButton.disable();
        }
    }
}

function checkBlur(e) {
    e.target.nextElementSibling.className = "hidden";
}

async function verifyData(initDataRaw) {
    const response = await fetch(
        "/verify_data",
        {
            method: "POST",
            body: JSON.stringify({
                "init_data": initDataRaw
            })
        }
    );
    return await response.json();
}


function buildWishForm(wish=null) {
    let content = document.getElementById("content");
    content.style.display = "none";

    let form = document.createElement("div");
    form.className = "form";
    form.id = "form";
    document.body.appendChild(form);

    Telegram.WebApp.BackButton.onClick(function () {
        content.style.display = "block";
        openTab(content.children.item(0).id, document.getElementById("tabWishes"));
        form.remove();
        Telegram.WebApp.BackButton.hide();
        Telegram.WebApp.MainButton.hide();
    });
    Telegram.WebApp.BackButton.show();

    let wishTitleDiv = document.createElement("div");
    wishTitleDiv.className = "input";

    let wishTitleInput = document.createElement("input");
    wishTitleInput.id = "wish-title";
    wishTitleInput.setAttribute("data-index", "1");
    wishTitleInput.type = "text";
    wishTitleInput.placeholder = "Title";
    wishTitleInput.placeholder = "Title";
    wishTitleInput.addEventListener("keyup", () => {
        if (wishTitleInput.value === null || wishTitleInput.value === "") {
            Telegram.WebApp.MainButton.color = "rgb(160, 160, 160)";
            Telegram.WebApp.MainButton.disable();
        } else {
            Telegram.WebApp.MainButton.color = Telegram.WebApp.themeParams.button_color;
            Telegram.WebApp.MainButton.enable();
        }
    });
    wishTitleDiv.appendChild(wishTitleInput);

    let wishTitleSpan = document.createElement("span");
    wishTitleSpan.className = "hidden";
    wishTitleDiv.appendChild(wishTitleSpan);

    form.appendChild(wishTitleDiv);

    let wishDescDiv = document.createElement("div");
    wishDescDiv.className = "input";

    let wishDescInput = document.createElement("textarea");
    wishDescInput.id = "wish-description";
    wishTitleInput.setAttribute("data-index", "2");
    wishDescInput.type = "text";
    wishDescInput.placeholder = "Description";
    wishDescDiv.appendChild(wishDescInput);

    let wishDescSpan = document.createElement("span");
    wishDescSpan.className = "hidden";
    wishDescDiv.appendChild(wishDescSpan);

    form.appendChild(wishDescDiv);

    let wishLinkDiv = document.createElement("div");
    wishLinkDiv.className = "input";

    let wishLinkInput = document.createElement("input");
    wishLinkInput.id = "wish-link";
    wishTitleInput.setAttribute("data-index", "3");
    wishLinkInput.type = "text";
    wishLinkInput.placeholder = "Link";
    wishLinkDiv.appendChild(wishLinkInput);

    let wishLinkSpan = document.createElement("span");
    wishLinkSpan.className = "hidden";
    wishLinkDiv.appendChild(wishLinkSpan);

    form.appendChild(wishLinkDiv);

    let wishImageLinkDiv = document.createElement("div");
    wishImageLinkDiv.className = "input";

    let wishImageLinkInput = document.createElement("input");
    wishImageLinkInput.id = "wish-image-link";
    wishTitleInput.setAttribute("data-index", "4");
    wishImageLinkInput.type = "text";
    wishImageLinkInput.placeholder = "Image link";
    wishImageLinkDiv.appendChild(wishImageLinkInput);

    let wishImageLinkSpan = document.createElement("span");
    wishImageLinkSpan.className = "hidden";
    wishImageLinkDiv.appendChild(wishImageLinkSpan);

    form.appendChild(wishImageLinkDiv);

    let wishPriceBlockDiv = document.createElement("div");
    wishPriceBlockDiv.className = "price-block";

    let wishPriceDiv = document.createElement("div");
    wishPriceDiv.className = "input";

    let wishPriceInput = document.createElement("input");
    wishPriceInput.id = "wish-price";
    wishTitleInput.setAttribute("data-index", "5");
    wishPriceInput.type = "text";
    wishPriceInput.placeholder = "Price";
    wishPriceDiv.appendChild(wishPriceInput);

    let wishPriceSpan = document.createElement("span");
    wishPriceSpan.className = "hidden";
    wishPriceDiv.appendChild(wishPriceSpan);

    wishPriceBlockDiv.appendChild(wishPriceDiv);

    let wishCurrencyDiv = document.createElement("div");
    wishCurrencyDiv.className = "input";

    let wishCurrencyInput = document.createElement("input");
    wishCurrencyInput.id = "wish-currency";
    wishCurrencyInput.setAttribute("list", "currency");
    wishTitleInput.setAttribute("data-index", "6");
    wishCurrencyInput.type = "text";
    wishCurrencyInput.placeholder = "Currency";
    wishCurrencyDiv.appendChild(wishCurrencyInput);

    let wishCurrencySpan = document.createElement("span");
    wishCurrencySpan.className = "hidden";
    wishCurrencyDiv.appendChild(wishCurrencySpan);

    let wishCurrencyList = document.createElement("datalist");
    wishCurrencyList.id = "currency";
    ["RUB", "EUR", "USD"].forEach((currency) => {
        let currencyOption = document.createElement("option");
        currencyOption.value = currency;
        currencyOption.textContent = currency;
        wishCurrencyList.appendChild(currencyOption);
    });

    wishCurrencyDiv.appendChild(wishCurrencyList);

    wishPriceBlockDiv.appendChild(wishCurrencyDiv);

    form.appendChild(wishPriceBlockDiv);

    if (wish.id !== null) {
        wishTitleInput.value = wish.name;
        wishDescInput.value = wish.description;
        wishLinkInput.value = wish.link;
        wishImageLinkInput.value = wish.image;
        wishPriceInput.value = wish.price;
        wishCurrencyInput.value = wish.currency;
        Telegram.WebApp.MainButton.text = "Save";
        Telegram.WebApp.MainButton.onClick(function () {editWish(wish.id);});
    } else {
        Telegram.WebApp.MainButton.text = "Add";
        Telegram.WebApp.MainButton.onClick(function () {addWish();});
    }

    if (wishTitleInput.value === null || wishTitleInput.value === "") {
        Telegram.WebApp.MainButton.color = "rgb(160, 160, 160)";
        Telegram.WebApp.MainButton.disable();
    } else {
        Telegram.WebApp.MainButton.color = Telegram.WebApp.themeParams.button_color;
        Telegram.WebApp.MainButton.enable();
    }
    Telegram.WebApp.MainButton.show();

    let keyboardHeight = 150;
    let buttonClick = false;
    let inputs = Array.prototype.slice.call(document.querySelectorAll("input[data-index]"));
    let inputCount = inputs.reduce((prev, curr) => curr > prev ? curr.getAttribute("data-index") : prev.getAttribute("data-index"));
    document.querySelectorAll("div[class='input'].input").forEach((div) => {
        let el = div.firstElementChild;
        const inputFieldRect = el.getBoundingClientRect();
        el.addEventListener("keyup", (e) => {
            checkInput(e);
        });
        el.addEventListener("keydown", (e) => {
            if (e.code === "Enter") {
                e.preventDefault();
                const index = parseInt(e.target.getAttribute("data-index"));
                e.target.blur();
                if (index < inputCount) {
                    document.querySelector('[data-index="' + (index+1) + '"]').focus();
                }
                el.nextElementSibling.className = "hidden";
            }
        });

        el.addEventListener("focusin",  (e) => {
            checkInput(e);
            if(["android", "ios"].includes(Telegram.WebApp.platform)) {
                document.body.style.height = (window.innerHeight + keyboardHeight).toString() + "px";
                window.scrollTo({
                    top: inputFieldRect.bottom - window.innerHeight + keyboardHeight,
                    behavior: 'smooth'
                });
            }
        });


        el.addEventListener("focusout", (e) => {
            setTimeout(() => {
                el.nextElementSibling.className = "hidden";
                if (buttonClick) {}
            }, 5);
            document.body.style.height = window.innerHeight.toString() + "px";
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            // buttonClick = false;
        });

        div.querySelector("span").addEventListener("click", (e) => {
            buttonClick = true;
            let input = e.target.previousElementSibling;
            input.value = "";
            input.focus();
            e.target.className = "hidden";
            buttonClick = false;
        });

    });
}


async function openChatUsers(chat_id) {
    const wishes = await getChatWishes(chat_id);
    const users = uniqueUsers(wishes);
    const chat = await getChatInfo(chat_id);

    let titleText = chat.tg_chat_name;
    document.getElementById("title").textContent = titleText;
    let subtitleText = users.length + " user";
    if (users.length > 1) {
        subtitleText += "s";
    }
    let subtitle = document.getElementById("subtitle");
    subtitle.textContent = subtitleText;
    subtitle.style.display = "flex";

    // let chatPhoto = document.getElementById("chat-photo");
    // if (chat.tg_chat_photo != null) {
    //     let img = document.createElement("img");
    //     img.src = "data:image/png;base64," + chat.tg_chat_photo;
    //     chatPhoto.appendChild(img);
    // }

    let tabs = document.getElementById("tabs");
    tabs.style.display = "none";

    let pageTitle = document.getElementById("pageTitle");
    pageTitle.style.display = "flex";

    let content = document.getElementById("content");
    let cardsContainer = document.createElement("div");
    cardsContainer.id = "users";
    cardsContainer.classList.add("grid-view");
    cardsContainer.classList.add("tab-content");
    content.appendChild(cardsContainer);
    openTab("users");
    Telegram.WebApp.BackButton.onClick(() => {
        Telegram.WebApp.BackButton.hide();
        cardsContainer.remove();
        pageTitle.style.display = "none";
        tabs.style.display = "flex";
        openTab("chats", document.getElementById("tabChats"));
    });
    const chats = document.getElementById("chats");
    if (chats) {
        Telegram.WebApp.BackButton.show();
    }

    for (let j=0; j<users.length; j++) {
        const userWishes = wishes.filter(function (wish) {
            return wish["tg_user_id"] === users[j].tg_user_id
        });
        const userWishesCount = userWishes.length;

        let card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("clickable");
        card.classList.add("active");
        card.onclick = async function () {
            await openUserWishes(userWishes, "userWishes");
        };
        cardsContainer.appendChild(card);

        let header = document.createElement("div");
        header.className = "card-header";
        card.appendChild(header);

        let userPhoto = document.createElement("div");
        userPhoto.className = "user-photo";
        header.appendChild(userPhoto);

        if (userWishes[0].tg_profile_photo != null) {
            let userPhotoImg = document.createElement("img");
            userPhotoImg.src = "data:image/png;base64," + userWishes[0].tg_profile_photo;
            userPhoto.appendChild(userPhotoImg);
        }

        let userInfo = document.createElement("div");
        userInfo.className = "user-info";
        header.appendChild(userInfo);

        let userName = document.createElement("div");
        userName.className = "card-title";
        userName.textContent = userWishes[0].tg_first_name ? userWishes[0].tg_first_name : userWishes[0].tg_username;
        userInfo.appendChild(userName);

        let wishCount = document.createElement("div");
        wishCount.className = "wish-count";
        wishCount.textContent = userWishesCount + "\nwish";
        wishCount.textContent += userWishesCount>1 ? "es" : "";
        userInfo.appendChild(wishCount);
    }
}


async function openUserWishes(wishes, containerId) {
    let cardsContainer = document.createElement("div");
    cardsContainer.id = containerId;
    cardsContainer.classList.add("grid-view");
    cardsContainer.classList.add("tab-content");
    document.getElementById("content").appendChild(cardsContainer);

    if (containerId === "userWishes") {
        document.getElementById("users").style.display = "none";
    }

    wishes.forEach(wish => {

        let card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("active");
        cardsContainer.appendChild(card);

        card.addEventListener("click", function(event) {
            if (!event.target.parentNode.parentNode.classList.contains("bottom-bar") &&
                !event.target.parentNode.classList.contains("bottom-bar") &&
                !event.target.classList.contains("bottom-bar")) {
                openWish(Wish.from(wish));
            }
        });

        let wishInfo = document.createElement("div");
        wishInfo.className = "wish-info";
        card.appendChild(wishInfo);

        let title = document.createElement("div");
        title.className = "wish-title";
        title.textContent = wish["name"];
        wishInfo.appendChild(title);

        if (wish["price"] !== null) {
            let price = document.createElement("div");
            price.className = "price";
            price.textContent = priceFormat(wish["price"]);
            if (wish["currency"] !== null) {
                price.textContent += " " + wish["currency"];
            }
            wishInfo.appendChild(price);
        }

        if (wish["image"] != null) {
            let wishPhoto = document.createElement("div");
            wishPhoto.className = "wish-image";
            card.appendChild(wishPhoto);

            let wishPhotoImg = document.createElement("img");
            wishPhotoImg.src = wish["image"];
            wishPhoto.appendChild(wishPhotoImg);
        }

        buildBottomBar(Wish.from(wish), card);
    });
}