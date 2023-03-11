---
Title: My review of Kontist: it's bad
Short_title: Review of Kontist
Description: I use Kontist as my business bank since January 2022. All of my business goes through it. This is my honest review of their service.
Date_created: 2023-03-10
---

[Kontist](/out/kontist) is a German bank. They offer business bank accounts ([*Geschäftskonto*](/glossary/Gesch%C3%A4ftskonto)) for freelancers.

I use Kontist as my main business account since January 2022. This is my review of Kontist, feature by feature.

{% include "blocks/_tableOfContents.html" %}

![Kontist mobile app and card](/images/kontist-review-proof-of-membership.jpg "Confirmed customer")

## Cost and fees

A Kontist account costs 9€ to 13€ per month. Other banks have similar monthly fees.

**[Compare Kontist plans ➞](/out/kontist-plans)**

Kontist's other fees are excessive:

- You get 10 free transactions per month, then you pay 0.15€ per transaction (incoming and outgoing). They added this fee in October 2022.[^6]
- You pay a 1.7% fee on foreign currency transactions (incoming and outgoing).[^8] For example, if you get $1,000 USD from a client, you pay around 17€ in fees.
- You also pay 2€ per ATM withdrawal. This is similar to other banks.

Those fees exclude VAT.

If you get paid in foreign currencies, or you have many small transactions, Kontist can get very expensive. In my case, I pay an extra 9€ per month in fees. [N26 Business](/out/n26-business) has much lower fees.

[![Kontist invoice with account fees](/images/kontist-account-fees.png "9€ for the account, and 9€ in transaction fees.")](/images/kontist-fees.png)

### Free account

Kontist has a account. Since October 2022, it's almost useless:

- You can only have 300€ per month in transactions.
- You only get 10 free transactions per month, then you pay 0.15€ per transaction.[^6]
- It only comes with a virtual credit card, no physical card.
- No invoicing, no data exports, no integration with bookkeeping tools.
- No automatic bookkeeping.

[N26 Business](/out/n26-business) has a better free account.

## Automatic tax deductions

When you are self-employed, you must save some of your income for [income tax](/glossary/Einkommensteuer) and [VAT](/glossary/Umsatzsteuer) payments. Sometimes, you have 5,000€ in your bank account, but 1,000€ is really yours. The rest is for the *[[Finanzamt]]*. It's hard to know how much money you really have.

Kontist promises to fix this. It automatically saves money for VAT and income tax payments. It shows you how much money is for you, and how much is for the *Finanzamt*.

[![VAT and tax deductions in the Kontist app](/images/kontist-vat-value.png "I can see how much VAT and income tax I owe on each transaction.")](/images/kontist-vat-value.png)

This is a great feature. It's why I opened a Kontist account. There is only one problem: **it does not work**. I explain why below.

### Automatic VAT

You decide how much [VAT](/glossary/Umsatzsteuer) to set aside for each transaction: 0%, {{ VAT_RATE_REDUCED }}% or {{ VAT_RATE }}%.

Kontist uses AI to guess the correct VAT rate for each transaction. It's often wrong. Instead of leaving transactions uncategorised, it puts them in the wrong category, with the wrong VAT rate.

The AI makes the same mistakes again and again. I get paid by the same people every month, and Kontist gets the VAT wrong every time. I have to fix those mistakes manually.

If you use Kontist with [Lexoffice](/out/lexoffice), it's better. I categorise transactions in Lexoffice, and they are categorised in Kontist too. You need the Duo account for this.

[![](/images/kontist-sort-transactions.png "You must set the VAT on each transaction. The AI does it automatically, but it's often wrong")](/images/kontist-sort-transactions.png)

There is no way to "reset" how much VAT you owe.

### Automatic income tax

Kontist sets some of your income aside for [income tax](/glossary/Einkommensteuer).

Unlike with VAT, there is no AI magic involved. You set your income tax rate in the settings, and Kontist takes that amount out of every transaction.

It's not very smart, but it works. Kontist does not have enough information to calculate your real income tax.

Kontist does not understand [trade tax](/glossary/Gewerbesteuer), which many self-employed people pay. There is no way to label a transaction as a trade tax payment.

This means that your income tax calculation is not precise. After you pay your taxes, there is no way to "reset" how much income tax you owe.

## Invoicing and bookkeeping

You can create invoices in Kontist, but Kontist does not send them for you. You must download them and email them manually.

When you get paid, Kontist matches the transactions to your invoices, and marks them as paid.

You can also upload receipts and attach them to your business expenses.

If you don't send many invoices, Kontist's invoicing feature is good enough. It's much cheaper than LexOffice, Debitoor, FastBill and other invoicing software.

### Reports

Kontist tells you how much money you have, and how much you owe the *[[Finanzamt]]*. That's all.

It does not tell you how much you made last month, or last year. This information is really important for most freelancers, and I wish Kontist showed it.

Most accounting software shows your monthly and yearly income. [Holvi](/out/holvi) is a business bank that shows this information.

### Exporting your data

You can export your transactions as CSV or MT940. This lets you import them into your accounting software.

You only do this in the mobile app, not in the web app. You must export the files on your phone, then send them to your computer to use them.

For monthly account statements (*[[Kontoauszug]]*), it's the opposite. You can export them in the web app, but not in the mobile app.

Kontist makes it too hard to reliably export your data. If you have all your accounting data in Kontist, it could be really hard to use a different tool later.

For example, there is no way to export all transactions *and* attached invoices. You must ask their customer support.

### Integration with other services

Kontist only syncs with [Lexoffice](/out/lexoffice) and [FastBill](https://www.fastbill.com/). It does not integrate with any English-speaking tax software.

You can match Kontist bank transactions to receipts and invoices in Lexoffice. This is nothing special. Most other banks also sync with Lexoffice, including my personal N26 account.

**Sometimes, some transactions don't sync.** One time, a client paid me. I could see the transaction in Kontist, but not in Lexoffice. All other transactions were there. I manually marked the invoice as paid.

A few months later, the missing transaction appeared in Lexoffice. I saw a dozen more transactions, all of them very late. If it happened a few months later, my [tax declaration](/glossary/Steuererkl%C3%A4rung) would have been wrong, and I could have been fined by the *Finanzamt*. This is a serious bug.

If you have a Kontist Duo account, it also syncs in the other direction. You can do your bookkeeping in Lexoffice, and see the changes in Kontist.

### Tax advisor access

Your tax advisor needs to access your invoices and expenses to prepare your [income tax](/glossary/Steuererklärung) and [VAT](/glossary/Umsatzsteuererklärung) declarations.

Kontist does not give your tax advisor access to your account. Other business banks like [Qonto](/out/penta) and [Holvi](/out/holvi) do. Almost all bookkeeping software does.

If you do your accounting with Kontist, you can only get a tax advisor through Kontist. Your bank should not decide which tax advisors you can work with.

## Web app and mobile app

### Everything is in English

The website, the app and the customer support are in English. You don't need to speak German to use Kontist.

[N26 Business](/out/n26-business), [Holvi](/out/holvi), [Qonto](/out/penta) and [Revolut](/out/revolut-business) also speak English.

### Too many ads

Kontist tries *really* hard to sell you more services. Every part of the app invites you to upgrade your account or refer a friend. There is no way to turn this off.

I already give Kontist around 13€ per month. I don't want to see ads.

![Kontist mobile app upsells](/images/kontist-mobile-app-upsells.png "Half of the buttons are ads, even with the most expensive account")

### Missing features

Some features only work in the mobile app:

- Exporting transactions to CSV or MT940
- Change your tax information
- Seeing how much you owe the *Finanzamt*
- Managing your credit cards

Other features only work in the web app:

- Creating invoices
- Exporting account statements

Other features are just missing. To change your address or personal information, you must contact customer service.

### SMS confirmation codes

Kontist uses its mobile app for two-factor authentication. If you log in on the web app, you must confirm it in the mobile app. It works reliably.

When you transfer money or change your card PIN, Kontist sends a confirmation code by SMS. SMS activation codes are not secure.[^9] It's also hard to receive SMS messages when you travel.[^0]

## Sending and receiving money

### Reliable payments

All my business transactions go through my Kontist account. Bank transfers and card payments always worked reliably.

I used my Kontist Visa card in Germany, but also in Nepal and India. It always worked well.

### You can't deposit cash

You can't deposit cash into your Kontist account.[^4] It's simply impossible. You must [transfer money](/glossary/SEPA-%C3%9Cberweisung) from another bank account.

When you open an account, you get your first invoice from Kontist. You must transfer money from another account to pay it.

## Customer service

Kontist has phone, email and chat support. Some banks only have email or chat support.

They usually answer in 1 business day. They give complete and useful answers, and they speak English.

## Tax advisor service

Kontist has a tax advisor service. I already have a tax advisor, so I don't use it.

They had a bookkeeping service, but discontinued it October 2022. They still advertise it in the app.

Your bank and your tax advisor should be two independent services. You should be able to change one without changing the other. This is why I don't recommend Kontist's tax advisor service.

**[English-speaking tax advisors in Berlin ➞](/guides/english-speaking-steuerberater-berlin)**

## Opening an account

It was easy to open a Kontist account. It took 5 minutes to create the account, and 5 more minutes to verify my identity. You can do it in English or in German, but the terms and conditions are only in German.

You only need a phone and an ID document. You don't need a registered address (*[[Anmeldung]]*). Kontist uses IDNow to verify your ID.[^2] Some passports are not supported by IDNow. Other online banks have the same problem.

Only freelancers, small businesses and sole traders can open an account. Corporations and partnerships (GmbH, KG, UG, or GbR) are not allowed.[^5]

## Conclusion

**I don't recommend Kontist.** There is no reason to choose them over another business bank. The fees are too high, and the promised features are not good enough.

Kontist was supposed to make my bookkeeping easier. It does not do that better than another bank.

### The good

- Banking just works.
- The web app and mobile apps are reliable
- The Kontist Duo plan with Lexoffice is a good deal
- The invoicing tool is basic, but good enough for some people

### The bad

- Transaction fees are too high
- The free account is not really free for most people.
- Auto-categorization does not work. The AI keeps making mistakes
- Synchronisation issues with Lexoffice
- The income tax estimation is not precise enough to be useful
- The invoicing tool is very basic

### Don't trust what you read

Bloggers get paid to recommend Kontist.[^7] When you open an account, they get around 50€. If they tell you that Kontist is bad, they make less money. They would not know, because they never used it.

Read [reviews from real users](https://www.trustpilot.com/review/kontist.com) instead, and decide for yourself.

## Konstist alternatives

If you need a business bank account to start a business in Germany, there are many other options.

I recommend to your bank, your accounting software and your tax advisor as 3 separate services. I use [Lexoffice](/out/lexoffice) for my bookkeeping, and I recommend it. My tax advisor is Suat Göydeniz.

**Other German business banks:**

- **[N26 Business](/out/n26-business)**  
    Exactly like N26 personal accounts, but for businesses. I am with N26 since 2016, and [I like it](/guides/an-honest-review-of-n26). There is no automatic accounting, but you can put money aside in "spaces". You can't have a personal N26 account *and* an N26 Business account.
- **[Holvi](/out/holvi)**  
    Very similar to Kontist. They have better invoicing and better reports. Your tax advisor can access your account and export transactions.
- **[Qonto](/out/qonto)**  
    Similar to Kontist. They let corporations and partnerships open an account.
- **[bunq Business](/out/bunq-business)**  
    Exactly like bunq personal accounts, but for businesses. They speak English.
- **[Finom](/out/finom)**  
    English-speaking business bank.
- **[Fyrst](/out/fyrst)**  
    German-speaking business bank.
- **Traditional banks**
    Commerzbank, Deutsche Bank and other large German banks all offer business accounts. They might not speak English.

[^0]: [trustpilot.com](https://www.trustpilot.com/reviews/62eaa6ab8000af4a8853a456)
[^1]: [reddit.com/r/finanzen](https://old.reddit.com/r/Finanzen/comments/scgrpu/steuerberater_als_freelancer/hu64wbv/)
[^2]: [intercom.help](https://intercom.help/kontist/en/articles/1559634-which-passports-are-accepted-for-video-verification)
[^3]: [solarisbank.com](https://www.solarisbank.com/en/support/)
[^4]: [intercom.help](https://intercom.help/kontist/de/articles/1559937-kann-ich-bareinzahlungen-auf-mein-kontist-konto-vornehmen)
[^5]: [intercom.help](https://intercom.help/kontist/en/articles/1559494-can-i-open-a-kontist-account-for-gmbh-kg-ug-gbr)
[^6]: 0.15€ plus VAT. [mobiflip.de](https://www.mobiflip.de/shortnews/kontist-dreht-an-der-preisschraube/)
[^7]: [kontist.com](https://kontist.com/product/partner/)
[^8]: [kontist.com](https://kontist.com/en/pricing/)
[^9]: [securityboulevard.com](https://securityboulevard.com/2021/12/why-using-sms-authentication-for-2fa-is-not-secure/)