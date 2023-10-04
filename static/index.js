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
    Telegram.WebApp.ready();
    Telegram.WebApp.enableClosingConfirmation();
    let initData = Telegram.WebApp.initDataUnsafe;
    document.getElementById("myUsername").textContent = initData.user.first_name;
    Telegram.WebApp.expand();
    const response = await get_wishes(initData);
    const res = await response.json();
    const wishes = await JSON.parse(res)["data"];
    for (let i=0; i<wishes.length; i++) {
        let wish = wishes[i];
        let card = document.createElement("div");
        card.className = "card";
        let div = document.getElementById("cards-container");
        div.appendChild(card);

        let title = document.createElement("div");
        title.className = "title";
        title.textContent = wish["name"];
        card.appendChild(title);

        let bottomBar = document.createElement("div");
        bottomBar.className = "bottom-bar";
        card.appendChild(bottomBar);

        let bookMark = document.createElement("div");
        bookMark.className = "link";
        bookMark.textContent = "Book";
        bookMark.onclick = function () {
          window.open(wish["link"]);
        }
        bottomBar.appendChild(bookMark);

        let link = document.createElement("div");
        link.className = "link";
        link.textContent = priceFormat(wish["price"]) + " " + wish["currency"];
        link.onclick = function () {
          window.open(wish["link"]);
        }
        bottomBar.appendChild(link);
    }
}


async function get_wishes(initData) {
    const response = await fetch(
        "/get_wishes?tgWebAppStartParam=" + initData.start_param,
        {
            method: "POST",
            headers: {
                "Access": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({user_id: initData.user.id})
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

function priceFormat(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

