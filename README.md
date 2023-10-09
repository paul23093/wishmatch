# wishmatch

[wishmatch webapp](https://github.com/paul23093/wishmatch-webapp) is a tool for creating, storing, managing and sharing your wishlist with friends.
It works based on [wishmatch bot](https://github.com/paul23093/wishmatch-bot) where you can grant access to your wishes in certain groups.

## How it works in personal chat

First of all, you need to /start conversation with [@wishmatch_bot](https://t.me/wishmatch_bot).
The you need to /grant access to your wishes list. You can always /revoke it.
Also if you update your Telegram info, use command /update_info to provide new details to webapp (username, first name, last name, photo).

After that click on `Open wishmatch` button and meet a user-friendly interface where you can create wish by clicking on `+` icon and fill the list of wish detailes: title, description, link to marketplace or etc., link to image, price amount (or range) and currency. Then click on `Add` button.
Then you will see your wish as a card on main webapp screen. You can always edit or delete it or quckly navigate to the wish by the link.

## How it works in group chats

First of all, someone needs to add the [@wishmatch_bot](https://t.me/wishmatch_bot) to the group and /start conversation.
The every member, who wants to be a part of wishes activity, needs to /grant access to your wishes list. They can always /revoke it.
Also if the group information (username, photo) was updated, use command /update_info to provide new group details to webapp.

After that click on `Open wishmatch` button and meet a user-friendly interface where you can also create wish by clicking on `+` icon and fill the list of wish detailes: title, description, link to marketplace or etc., link to image, price amount (or range) and currency. Then click on `Add` button.
Then you will see your wish as a card on main webapp screen. You can always edit or delete it or quckly navigate to the wish by the link.

But the main purpose of this webapp is to share wishes between group members like in separate wishlist sites. So once each member who granted the access, add their wishes, you will see cards of them and you can click on member card to deep into their wishes. For each fiend wish you cann book it by clicking `waving hand` button. By doing this, you are notifying other friends (except the wish owner) that you are going to buy it for the wish owner and the other guys will not be able to book it since this moment.

## How to build and up this.

You need to have your own hosting and https domain.
On your hosting you have to:
1. Deploy database like postgresql
2. Git clone [wishmatch bot](https://github.com/paul23093/wishmatch-bot)
3. Git clone [wishmatch webapp](https://github.com/paul23093/wishmatch-webapp)
4. Create `.env` file where you will store your credentials of postgresql (`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DB`) and your Telegram bot token (`TOKEN`).
5. Replace the path to `.env` file in `docker-compose.yml` file [here](https://github.com/paul23093/wishmatch-webapp/blob/9d23e150c5ab5beb266c7d83e83e5a4843fd86ef/docker-compose.yml#L10C10-L10C10) and [here](https://github.com/paul23093/wishmatch-bot/blob/1d6ef703cf7f489a77cb219a6efef58e35a7bdd3/docker-compose.yml#L10).
6. cd wishmatch_bot && docker-compose build && docker-compose up -d
7. cd wishmatch_webapp && docker-compose build && docker-compose up -d

## Developer

[Pavel Semenov](https://github.com/paul23093)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
