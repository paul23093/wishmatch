function newWish() {
    let newWindow = document.createElement("div");
    newWindow.className = "wish";
    let userDataArray = document.getElementsByClassName("userData");
    let userData = userDataArray[userDataArray.length-1];
    userData.parentNode.insertBefore(newWindow, userData.nextSibling);
}

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

    let touchstartY = 0;
    document.addEventListener('touchstart', e => {
      touchstartY = e.touches[0].clientY;
    });
    document.addEventListener('touchmove', e => {
      const touchY = e.touches[0].clientY;
      const touchDiff = touchY - touchstartY;
      if (touchDiff > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    });
    document.addEventListener('touchend', e => {
    });

    Telegram.WebApp.ready();
    Telegram.WebApp.enableClosingConfirmation();
    const initData = Telegram.WebApp.initDataUnsafe;
    const chat_type = initData.chat_type;
    console.log(chat_type);
    let titleText = initData.user.first_name;
    if (chat_type === "group") {
        titleText = 'Group wishes'
    }
    document.getElementById("title").textContent = titleText;
    Telegram.WebApp.expand();
    const response = await get_wishes(initData);
    const res = await response.json();
    const wishes = await JSON.parse(res)["data"];
    const users = uniqueUsers(wishes);
    if (users.length === 1) {
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
            bookMark.className = "link";
            bottomBar.appendChild(bookMark);
            if (wish["is_booked"] === false) {
                bookMark.textContent = "Book";
                bookMark.parentElement.parentElement.classList.add("active");
            } else {
                bookMark.textContent = "Unbook";
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
                    bookMark.textContent = "Unbook";
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
                    bookMark.textContent = "Book";
                }
            });

            let link = document.createElement("div");
            link.className = "link";
            link.textContent = "Link";
            link.onclick = function () {
                window.open(wish["link"]);
            }
            bottomBar.appendChild(link);
        }
    }
    else {
        for (let j=0; j<users.length; j++) {
            const user_wishes = wishes.filter(function (wish) {
                return wish["tg_user_id"] === users[j]
            });
            const user_wishes_count = user_wishes.length;

            let card = document.createElement("div");
            card.classList.add("card");
            card.classList.add("active");
            let div = document.getElementById("cards-container");
            div.appendChild(card);

            let title = document.createElement("div");
            title.className = "card-title";
            title.textContent = user_wishes[0].tg_user_id;
            card.appendChild(title);

            let price = document.createElement("div");
            price.className = "price";
            price.textContent = user_wishes_count + "\nwishes";
            card.appendChild(price);
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
            body: JSON.stringify({chat_id: initData.start_param})
        }
    )
    return response;
}


function load_new_wish() {
    addEventListener("keydown", (event) => {
        if (event.code === "Enter") {
            event.preventDefault();
            const index = parseInt(event.target.getAttribute("data-index"));
            if (index < 3) {
                document.querySelector('[data-index="' + (index+1) + '"]').focus();
            }
        }
    });

    document.querySelector('[data-index="3"]').addEventListener('keydown', (event) => {
        if (event.code === 'Enter') {
            event.target.blur();
        }
    });
}

async function add_wish() {
    let initData = Telegram.WebApp.initDataUnsafe;
    let tg_user_id = initData.user.id;
    let name = document.getElementById("title").value;
    let link = document.getElementById("link").value;
    let price = document.getElementById("price").value;
    
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
			    price: price
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
    return wishes
        .map((item) => item.tg_user_id)
        .filter(
            (value, index, current_value) => current_value.indexOf(value) === index
        );
};