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

    let tabsContent = document.querySelectorAll(".tab-content");
    tabsContent.forEach((tabContent) => {
        tabContent.style.display = "none";
    });

    let tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab) => {
        tab.classList.remove("active");
    });

    document.getElementById(tabName).style.display = "grid";
    if (el !== null) {
        document.getElementById("tabs").style.display = "flex";
        setTimeout(() => {
            document.getElementById("tabs").style.opacity = "1";
            document.getElementById("tabs").style.transform = "translateY(0)";
        }, 0);
        document.getElementById("pageTitle").style.opacity = "0";
        document.getElementById("pageTitle").style.transform = "translateY(20%)";
        setTimeout(() => {
          document.getElementById("pageTitle").style.display = 'none';
        }, 500);
        el.classList.add("active");
    } else {
        document.getElementById("tabs").style.opacity = "0";
        document.getElementById("tabs").style.transform = "translateY(-20%)";
        setTimeout(() => {
          document.getElementById("tabs").style.display = 'none';
        }, 500);
        document.getElementById("pageTitle").style.display = "flex";
        setTimeout(() => {
            document.getElementById("pageTitle").style.opacity = "1";
            document.getElementById("pageTitle").style.transform = "translateY(0)";
        }, 0);
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
            chatPhoto.style.transform = "translateX(0)";
            chatPhoto.style.height = "100%";
            chatPhoto.style.opacity = "1";
        }
    } else {
        let tabs = document.getElementById("tabs");
        tabs.style.display = "flex";
        setTimeout(() => {
            tabs.style.opacity = "1";
        }, 0);
        const userInfo = await getUserInfo();
        if (userInfo != null) {
            let userPhoto = document.getElementById("chat-photo");
            if (userInfo.tg_profile_photo != null) {
                let img = document.createElement("img");
                img.src = "data:image/png;base64," + userInfo.tg_profile_photo;
                userPhoto.appendChild(img);
                userPhoto.style.transform = "translateX(0)";
                userPhoto.style.opacity = "1";
            }
        }
    }
    let iconAddWish = document.getElementById("addWish");
    iconAddWish.style.transform = "translateX(0)";
    iconAddWish.style.opacity = "1";

    let title = document.getElementById("title");
    title.textContent = titleText;
    title.style.transform = "translateY(0)";
    title.style.opacity = "1";

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
        await openChatUsers(chat_id);
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
        Telegram.WebApp.MainButton.offClick(addWish);
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
        Telegram.WebApp.MainButton.offClick(function () {editWish(id);});
        Telegram.WebApp.MainButton.hideProgress();
    });
    window.location.replace(document.referrer);
}

function openWish(userWish) {
    let card = document.createElement("div");
    card.id = "wishDetails";
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

    Telegram.WebApp.BackButton.onClick(hideWishDetailsCallback);
    Telegram.WebApp.BackButton.show();
}

function buildBottomBar(wish, card, showLabels=false) {
    let initData = Telegram.WebApp.initDataUnsafe;
    let initDataRaw = Telegram.WebApp.initData;
    let bottomBar = document.createElement("div");
    bottomBar.className = "bottom-bar";
    card.appendChild(bottomBar);

    if (wish.tgUserId === initData.user.id) {
        let divDelete = document.createElement("div");
        bottomBar.appendChild(divDelete);
        let iconDelete = document.createElement("span");
        iconDelete.classList.add("material-symbols-outlined");
        iconDelete.textContent = "delete";
        divDelete.appendChild(iconDelete);
        if (showLabels) {
            let labelDelete = document.createElement("span");
            labelDelete.className = "button-label";
            labelDelete.textContent = "Delete";
            divDelete.appendChild(labelDelete);
        }

        divDelete.addEventListener("click", function () {
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
                        divDelete.parentElement.parentElement.remove();
                    }
                }
            )
        });

        let divEdit = document.createElement("div");
        divEdit.onclick = function () {
            buildWishForm(wish);
        };
        bottomBar.appendChild(divEdit);
        let iconEdit = document.createElement("span");
        iconEdit.classList.add("material-symbols-outlined");
        iconEdit.textContent = "edit";
        divEdit.appendChild(iconEdit);
        if (showLabels) {
            let labelEdit = document.createElement("span");
            labelEdit.className = "button-label";
            labelEdit.textContent = "Edit";
            divEdit.appendChild(labelEdit);
        }
    } else if (wish.isBooked === false || (wish.isBooked === true && wish.bookedBy === initData.user.id)) {
        let divBook = document.createElement("div");
        bottomBar.appendChild(divBook);

        let iconBook = document.createElement("span");
        iconBook.classList.add("material-symbols-outlined");
        divBook.appendChild(iconBook);
        if (wish.isBooked === false) {
            iconBook.textContent = "hand_gesture";
            divBook.parentElement.parentElement.classList.add("active");
            if (showLabels) {
                let labelBook = document.createElement("span");
                labelBook.className = "button-label";
                labelBook.textContent = "Book";
                divBook.appendChild(labelBook);
            }
        } else {
            iconBook.textContent = "do_not_touch";
            divBook.parentElement.parentElement.classList.add("booked");
            if (showLabels) {
                let labelBook = document.createElement("span");
                labelBook.className = "button-label";
                labelBook.textContent = "Unbook";
                divBook.appendChild(labelBook);
            }
        }

        divBook.addEventListener("click", async function () {
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
                divBook.querySelector("span[class='material-symbols-outlined']").textContent = "do_not_touch";
                divBook.querySelector("span[class='button-label']").textContent = "Unbook";
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
                divBook.querySelector("span[class='material-symbols-outlined']").textContent = "hand_gesture";
                divBook.querySelector("span[class='button-label']").textContent = "Book";
            }
        });
    } else if (wish.isBooked === true && wish.bookedBy !== initData.user.id) {
        bottomBar.parentElement.classList.add("booked");
    }

    if (wish.link != null) {
        let divLink = document.createElement("div");
        let iconLink = document.createElement("span");
        iconLink.classList.add("material-symbols-outlined");
        iconLink.textContent = "open_in_new";
        divLink.appendChild(iconLink);
        if (showLabels) {
            let labelLink = document.createElement("span");
            labelLink.className = "button-label";
            labelLink.textContent = "Link";
            divLink.appendChild(labelLink);
        }
        divLink.addEventListener("click", () => {
            window.open(wish.link);
        });
        bottomBar.appendChild(divLink);
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

    Telegram.WebApp.BackButton.offClick(backToChatsCallback);
    Telegram.WebApp.BackButton.offClick(backToUsersCallback);
    Telegram.WebApp.BackButton.offClick(hideWishDetailsCallback);
    Telegram.WebApp.BackButton.offClick(hideWishFormCallback);
    Telegram.WebApp.MainButton.offClick(addWish);
    Telegram.WebApp.MainButton.onClick(function () {editWish(wish.id);});

    Telegram.WebApp.BackButton.onClick(hideWishFormCallback);
    Telegram.WebApp.BackButton.show();

    let wishTitleDiv = document.createElement("div");
    wishTitleDiv.className = "input";

    let wishTitleInput = document.createElement("input");
    wishTitleInput.id = "wish-title";
    wishTitleInput.setAttribute("data-index", "1");
    wishTitleInput.type = "text";
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
    wishTitleSpan.textContent = "✖";
    wishTitleSpan.className = "hidden";
    wishTitleDiv.appendChild(wishTitleSpan);

    form.appendChild(wishTitleDiv);

    let wishDescDiv = document.createElement("div");
    wishDescDiv.className = "input";

    let wishDescInput = document.createElement("textarea");
    wishDescInput.id = "wish-description";
    wishDescInput.setAttribute("data-index", "2");
    wishDescInput.type = "text";
    wishDescInput.placeholder = "Description";
    wishDescDiv.appendChild(wishDescInput);

    let wishDescSpan = document.createElement("span");
    wishDescSpan.textContent = "✖";
    wishDescSpan.className = "hidden";
    wishDescDiv.appendChild(wishDescSpan);

    form.appendChild(wishDescDiv);

    let wishLinkDiv = document.createElement("div");
    wishLinkDiv.className = "input";

    let wishLinkInput = document.createElement("input");
    wishLinkInput.id = "wish-link";
    wishLinkInput.setAttribute("data-index", "3");
    wishLinkInput.type = "text";
    wishLinkInput.placeholder = "Link";
    wishLinkDiv.appendChild(wishLinkInput);

    let wishLinkSpan = document.createElement("span");
    wishLinkSpan.textContent = "✖";
    wishLinkSpan.className = "hidden";
    wishLinkDiv.appendChild(wishLinkSpan);

    form.appendChild(wishLinkDiv);

    let wishImageLinkDiv = document.createElement("div");
    wishImageLinkDiv.className = "input";

    let wishImageLinkInput = document.createElement("input");
    wishImageLinkInput.id = "wish-image-link";
    wishImageLinkInput.setAttribute("data-index", "4");
    wishImageLinkInput.type = "text";
    wishImageLinkInput.placeholder = "Image link";
    wishImageLinkDiv.appendChild(wishImageLinkInput);

    let wishImageLinkSpan = document.createElement("span");
    wishImageLinkSpan.textContent = "✖";
    wishImageLinkSpan.className = "hidden";
    wishImageLinkDiv.appendChild(wishImageLinkSpan);

    form.appendChild(wishImageLinkDiv);

    let wishPriceBlockDiv = document.createElement("div");
    wishPriceBlockDiv.className = "price-block";

    let wishPriceDiv = document.createElement("div");
    wishPriceDiv.className = "input";

    let wishPriceInput = document.createElement("input");
    wishPriceInput.id = "wish-price";
    wishPriceInput.setAttribute("data-index", "5");
    wishPriceInput.type = "text";
    wishPriceInput.placeholder = "Price";
    wishPriceDiv.appendChild(wishPriceInput);

    wishPriceBlockDiv.appendChild(wishPriceDiv);

    let wishCurrencyDiv = document.createElement("div");
    wishCurrencyDiv.className = "input";

    let wishCurrencyInput = document.createElement("input");
    wishCurrencyInput.id = "wish-currency";
    wishCurrencyInput.setAttribute("list", "currency");
    wishCurrencyInput.setAttribute("data-index", "6");
    wishCurrencyInput.type = "text";
    wishCurrencyInput.placeholder = "Currency";
    wishCurrencyDiv.appendChild(wishCurrencyInput);

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

    if (wish !== null) {
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
        Telegram.WebApp.MainButton.onClick(addWish);
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
    let title = document.getElementById("title");
    title.textContent = titleText;
    title.style.transform = "translateY(0)";
    title.style.opacity = "1";

    // let subtitleText = users.length + " user";
    // if (users.length > 1) {
    //     subtitleText += "s";
    // }
    // let subtitle = document.getElementById("subtitle");
    // subtitle.textContent = subtitleText;
    // subtitle.style.transform = "translateY(0)";
    // subtitle.style.opacity = "1";

    // let chatPhoto = document.getElementById("chat-photo");
    // if (chat.tg_chat_photo != null) {
    //     let img = document.createElement("img");
    //     img.src = "data:image/png;base64," + chat.tg_chat_photo;
    //     chatPhoto.appendChild(img);
    // }

    let content = document.getElementById("content");
    let cardsContainer = document.createElement("div");
    cardsContainer.id = "users";
    cardsContainer.classList.add("grid-view");
    cardsContainer.classList.add("tab-content");
    content.appendChild(cardsContainer);
    openTab("users");
    const chats = document.getElementById("chats");
    if (chats) {
        Telegram.WebApp.BackButton.onClick(backToChatsCallback);
        Telegram.WebApp.BackButton.show();
    }

    users.forEach((user) => {
        const userWishes = wishes.filter(function (wish) {
            return wish["tg_user_id"] === user.tg_user_id
        });
        const userWishesCount = userWishes.length;

        let card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("clickable");
        card.classList.add("active");
        card.addEventListener("click", async () => {
            Telegram.WebApp.BackButton.offClick(backToChatsCallback);
            await openUserWishes(userWishes, "userWishes");
        });
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
    });
}


async function openUserWishes(wishes, containerId) {
    let cardsContainer = document.createElement("div");
    cardsContainer.id = containerId;
    cardsContainer.classList.add("grid-view");
    cardsContainer.classList.add("tab-content");
    document.getElementById("content").appendChild(cardsContainer);

    if (containerId === "userWishes") {
        document.getElementById("users").style.display = "none";

        document.getElementById("title").textContent = wishes[0]["tg_username"];
        document.getElementById("subtitle").textContent = wishes[0]["tg_chat_name"];

        Telegram.WebApp.BackButton.offClick(backToChatsCallback);
        Telegram.WebApp.BackButton.onClick(backToUsersCallback);
        Telegram.WebApp.BackButton.show();
    }

    wishes.forEach(wish => {

        let card = document.createElement("div");
        card.classList.add("card");
        card.classList.add("active");
        cardsContainer.appendChild(card);

        card.addEventListener("click", function(event) {
            Telegram.WebApp.BackButton.offClick(backToUsersCallback);
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


function backToChatsCallback() {
    Telegram.WebApp.BackButton.hide();
    document.getElementById("users").remove();
    openTab("chats", document.getElementById("tabChats"));
    Telegram.WebApp.BackButton.offClick(backToChatsCallback);
}


function backToUsersCallback() {
    let chats = document.getElementById("chats");
    if (!chats) {
        Telegram.WebApp.BackButton.hide();
    }
    document.getElementById("userWishes").remove();
    document.getElementById("title").textContent = null;
    document.getElementById("subtitle").textContent = null;
    openTab("users");
    Telegram.WebApp.BackButton.offClick(backToUsersCallback);
    Telegram.WebApp.BackButton.onClick(backToChatsCallback);
}


function hideWishDetailsCallback() {
    document.getElementById("content").style.display = "block";;
    document.getElementById("wishDetails").remove();
    Telegram.WebApp.BackButton.offClick(hideWishDetailsCallback);
    let users = document.getElementById("users");
    if (users) {
        Telegram.WebApp.BackButton.onClick(backToUsersCallback);
    } else {
        Telegram.WebApp.BackButton.hide();
    }
}


function hideWishFormCallback() {
    let content = document.getElementById("content");
    content.style.display = "block";
    document.getElementById("form").remove();
    let myWishes = document.getElementById("myWishes");
    if (myWishes) {
        openTab(content.children.item(0).id, document.getElementById("tabWishes"));
    } else {
        openTab(content.children.item(0).id);
    }
    Telegram.WebApp.BackButton.hide();
    Telegram.WebApp.MainButton.hide();
    Telegram.WebApp.BackButton.offClick(hideWishFormCallback);
}