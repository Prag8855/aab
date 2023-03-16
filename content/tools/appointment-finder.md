---
Title: Anmeldung appointment finder
Description: This tool helps you find an appointment to register your address at the Bürgeramt.
Date_created: 2022-06-15
Date_updated: 2022-08-26
---

This tool helps you find an appointment to [register your address](/glossary/Anmeldung) at the *[[Bürgeramt]]*.

{% include "blocks/_appointmentFinderStatic.html" %}

**[Other ways to get a Bürgeramt appointment ➞](/guides/berlin-burgeramt-appointment)**

{% include "blocks/_tableOfContents.html" %}

## What's wrong with Bürgeramt appointments?

In Berlin, most government services require an appointment. If you want to [register an address](/glossary/Anmeldung), renew a passport or get a driving licence, you must book an appointment at the [[Bürgeramt]].

**Bürgeramt appointments are hard to find**. Most of the time, there are no appointments.[^0] You must refresh the page again and again until you find one. Since most appointments are added during business hours,[^1] many Berliners must do this during work.

![Berlin.de showing no available appointments](/images/berlin-buergeramt-termin-kalender-b.png "No appointments available. Typisch Berlin.")

Most of the time, **the only appointments are in 6-8 weeks**.[^2] Recent immigrants can't wait this long to register their address, because they need a [registration certificate](/glossary/Anmeldebest%C3%A4tigung) and a [tax ID](/glossary/Steueridentifikationsnummer) *right now*. If they can't wait, they can't be picky about location. They might need to go to a Bürgeramt across the city in the middle of a work day.

People can't predict their schedule 6 to 8 weeks in advance, so many people miss their appointments.[^3] In some districts, 20% of people don't go to their appointments.[^4]

**The lack of appointments affects everyone**. Car buyers can't drive their vehicle, because they can't register it.[^5] Travellers can't leave Germany, because they can't renew their passport.[^6] Parents can't apply for *[[Kindergeld]]*, because they can't [register their address](/glossary/Anmeldung). Immigrants must pay the maximum income tax rate, because they don't have a [tax ID](/glossary/Steueridentifikationsnummer). These delays cause serious problems.

## Why are there no Bürgeramt appointments?

This has been a problem for many years. There was some progress, but it's still a problem. The reasons have not changed.[^26]

### Personnel shortage

There are not enough Bürgeramt employees to help everyone.[^7] The government promises to hire more personnel, but the situation does not improve.[^8] The population of Berlin grows quickly,[^9] and more people need government services. Many employees retire and must be replaced.[^10] There are still many vacant positions, and not enough budget to hire new employees.

Coronavirus also had an impact.[^11] During the pandemic, only 60% of Bürgeramt employees were working.[^12] In some cases, it was only 25%.[^13] Some of the employees were also reassigned to contact tracing.[^14]

### Inefficiency

Bürgeramt appointments take time. A Bürgeramt employee only handles 18 cases per day.[^15] Adding more people helps, but it does not solve this problem.

To make things worse, a thousand Berliners miss their Bürgeramt appointment every day.[^16] In Pankow, 10% don't go to their appointments In Neukölln, it's 20%.[^17] It could be that people forget their appointments, or that their plans change and they can't go. There are no appointment reminders. An email and SMS reminder system was announced in 2018,[^18] but it's still missing.

### When will things change?

Every new government promises to work on this, including the current government. More employees, more digitalisation, longer opening hours.[^19]

Digitisation will help, but it's happening very slowly.[^20] More and more services are available online,[^21] but essential services still require a Bürgeramt visit. Some online services require a digital ID,[^22] which many immigrants are still waiting for.

## About this tool

### Why I built this

It's a small act of [guerilla public service](https://99percentinvisible.org/episode/guerrilla-public-service/). I moved to Berlin in 2015. Since 2017, I help others make Berlin their home. It's frustrating to see them have the same problems I had 7 years ago. I wanted to build something useful, but also draw attention to this problem.

In the long term, we should fix Berlin's administration, not build hacks around it.

### How does it work?

This tool checks the Berlin.de [appointments page](/out/appointment-anmeldung) every 3 minutes. When it finds new appointments, it shows them on this page. It's a simple Python script that talks to this page with websockets. The frontend is a few lines of JavaScript powered by Vue.js. [The source code is on GitHub](https://github.com/nicbou/burgeramt-appointments-websockets).

This tool makes the same number of requests, no matter how many people use it. It does not add more load to Berlin.de's servers; it reduces it.

### Limitations

The tool can only check Berlin.de every 3 minutes. This is required by the Berlin.de IKT-ZMS team. This is a big limitation, and there is no way around it.

It's not possible to filter *Bürgeramt* locations, because this information is not available without crawling more pages, and that is not allowed.

This means that it cannot check for other types of appointments - only the *Anmeldung*.

### Is this ethical?

**I'm not sure.** This tool does not create more *Bürgeramt* appointments. It makes it easier for people who use the tool, but also harder for those who don't. It does not solve the appointment problem. Only the city of Berlin can do that.

Then again, anyone can use this tool. It's completely free. It does not ask for your email, it does not collect your personal data, and it does not try to sell you something. In 2015, a startup built a similar tool, and use it to sell appointments for 45€ each.[^23] Now, a similar startup sells Ausländerbehörde appointments for 50€.

This tool is different: it does not have a business model. It's meant to be free for everyone. You even can [download its source code](https://github.com/nicbou/burgeramt-appointments-websockets) and use it yourself.

### What will happen next?

The tool is allowed to stay online in its current state, but this right can be revoked. It is not possible to add more types of appointments.

When I launched this tool in January 2022, it stayed online for only 7 hours. I deactivated it when I learned that it broke Berlin.de's rules. In those 7 hours, it got thousands of visitors, mentions in the newspapers,[^24] and a strong reaction on social media.[^25]

I contacted the IKT-ZMS team - the people who build the official appointment booking system - and asked them if I could reactivate the tool. They said yes, if I only poll Berlin.de every 3 minutes (instead of every 30 seconds). This makes the tool less useful, but it still works.

6 months later, I met the team in person. Over a few hours, they explained every problem they face, and why it's so hard to fix things. It's much harder than it looks, but there is still room for easy improvements.

In the future, I want to work with them to make some of those improvements.

[^0]: [plus.tagesspiegel.de](https://plus.tagesspiegel.de/der-graue-lappen-ist-zuruck-die-jagd-nach-dem-internationalen-fuhrerschein-wird-zum-sussen-nostalgie-erlebnis-336706.html), [docs.google.com](https://docs.google.com/spreadsheets/d/1V-FcoMlyZG522poQmL1pAZ7WEBdIERiYx1TxP4MnYVg/), [tagesspiegel.de](https://www.tagesspiegel.de/berlin/250-000-unerledigte-termine-keine-loesung-fuer-terminstau-bei-berliner-buergeraemtern/27289880.html), [checkpoint.tagesspiegel.de](https://checkpoint.tagesspiegel.de/langmeldung/zeWyOidG3PriBabT5nd8b)
[^1]: [nicolasbouliane.com](https://nicolasbouliane.com/blog/berlin-buergeramt-experiment)
[^2]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/keine-freien-termine-mehr-bis-august-berlins-innensenator-schlaegt-zentralisierung-der-buergeraemter-vor/27271230.html), [docs.google.com](https://docs.google.com/spreadsheets/d/1V-FcoMlyZG522poQmL1pAZ7WEBdIERiYx1TxP4MnYVg/)
[^3]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/wartezeiten-bei-buergeraemtern-berlin-will-termine-vorerst-nur-per-telefon-vergeben/12660108.html#:~:text=wo%20sechs%20monate%20im%20voraus%20termin-fixierung%20moglich%20sei%2C%20steige%20au%C3%9Ferdem%20die%20ausfall-%20und%20vergessensquote%20erheblich)
[^4]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/keine-freien-termine-mehr-bis-august-berlins-innensenator-schlaegt-zentralisierung-der-buergeraemter-vor/27271230.html#:~:text=jeder%20zehnte%20termin%20werde%20dadurch%20in%20pankow%20nicht%20wahrgenommen.%20in%20neukolln%20seien%20es%20sogar%2020%20prozent.), [rbb24.de \(archived\)](https://web.archive.org/web/20220104195144/https://www.rbb24.de/politik/beitrag/2021/06/berlin-terminmangel-laengere-oeffnungszeiten-buergeraemter.html)
[^5]: [bz-berlin.de](https://www.bz-berlin.de/berlin/auto-anmeldung-dauert-in-berlin-bis-zu-zwei-wochen), [tagesspiegel.de](https://www.tagesspiegel.de/berlin/auto-anmelden-in-berlin-schlange-stehen-in-der-zulassungsstelle/20101410.html)
[^6]: [focus.de](https://www.focus.de/regional/berlin/reisepass-in-berlin-beantragen-das-muessen-sie-beachten_id_6814741.html)
[^7]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/keine-freien-termine-mehr-bis-august-berlins-innensenator-schlaegt-zentralisierung-der-buergeraemter-vor/27271230.html#:~:text=Mit%20welchen%20Mitarbeitern%3F-,mit%20welchen%20mitarbeitern,-%3F%22%20Der%20Vorschlag%20des)
[^8]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/wegen-personalmangels-der-alltaegliche-wahnsinn-an-berliner-buergeraemtern/11758190.html#:~:text=ende%202014%20hat%20der%20finanzsenator%20den%20burgeramtern%2031%20zusatzliche%20stellen), [tagesspiegel.de](https://www.tagesspiegel.de/berlin/wegen-personalmangels-der-alltaegliche-wahnsinn-an-berliner-buergeraemtern/11758190.html), [bz-berlin.de](https://www.bz-berlin.de/berlin/neues-personal-fuer-berlins-buergeraemter), [tagesspiegel.de](https://www.tagesspiegel.de/berlin/personalmangel-der-berliner-bezirksaemter-senat-verspricht-mehr-als-1200-zusaetzliche-stellen/19898592.html)
[^9]: [Wikipedia](https://en.wikipedia.org/wiki/Berlin_population_statistics)
[^10]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/personalmangel-der-berliner-bezirksaemter-senat-verspricht-mehr-als-1200-zusaetzliche-stellen/19898592.html)
[^11]: [rbb24.de](https://www.rbb24.de/politik/thema/2020/coronavirus/beitraege_neu/2020/05/berlin-buergeramt-aemter-service-notbetrieb-persoenliche-termine.html)
[^12]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/situation-ist-unbefriedigend-berlin-bekommt-ein-neues-buergeramt/27254122.html#:~:text=in%20den%20burgeramtern%20seien%20derzeit%2060%20prozent%20aller%20mitarbeiter%20im%20%E2%80%9Efront%20office%E2%80%9C%20im%20einsatz)
[^13]: [rbb24.de](https://www.rbb24.de/politik/thema/corona/beitraege/2021/11/behoerdenstau-brandenburg-rathaus-buergeraemter-termine.html#:~:text=sechs%20von%20acht%20mitarbeitern%20erkrankt)
[^14]: [rbb24.de](https://www.rbb24.de/politik/thema/corona/beitraege/2021/11/behoerdenstau-brandenburg-rathaus-buergeraemter-termine.html)
[^15]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/situation-ist-unbefriedigend-berlin-bekommt-ein-neues-buergeramt/27254122.html#:~:text=pro%20mitarbeiter%20konnen%2018%20termine%20pro%20tag%20angeboten%20werden), [rbb24.de \(archived\)](https://web.archive.org/web/20220104195144/https://www.rbb24.de/politik/beitrag/2021/06/berlin-terminmangel-laengere-oeffnungszeiten-buergeraemter.html)
[^16]: [berlin.de](https://service.berlin.de/terminvereinbarung/hinweise/#:~:text=leider%20werden%20insgesamt%20etwa%201.000%20termine%2Ftag%20nicht%20wahrgenommen.)
[^17]: [tagesspiegel.de](https://www.tagesspiegel.de/berlin/keine-freien-termine-mehr-bis-august-berlins-innensenator-schlaegt-zentralisierung-der-buergeraemter-vor/27271230.html#:~:text=jeder%20zehnte%20termin%20werde%20dadurch%20in%20pankow%20nicht%20wahrgenommen.%20in%20neukolln%20seien%20es%20sogar%2020%20prozent.)
[^18]: [morgenpost.de](https://www.morgenpost.de/berlin/article213130353/Buergeramt-Berliner-sollen-Wunschtermin-einfacher-bekommen.html#:~:text=das%20neue%20system%20soll%20die%20berliner%20zudem%20per%20e-mail%20oder%20sms)
[^19]: [rbb24.de \(archived\)](https://web.archive.org/web/20211204171454/https://www.rbb24.de/politik/beitrag/2021/07/buergeraemter-berlin-zusaetzliche-termine-massnahmen-.html)
[^20]: [rbb24.de \(archived\)](https://web.archive.org/web/20211101080501/https://www.rbb24.de/politik/beitrag/2021/09/digitalisierung-verwaltung-berlin-r2g-bilanz.html), [tagesspiegel.de](https://www.tagesspiegel.de/berlin/berliner-senat-schafft-50-neue-stellen-schlange-ade-es-gibt-wieder-termine-im-buergeramt/19206014.html)
[^21]: [berlin.de](https://www.berlin.de/ea/unsere-online-verfahren/service.758896.php)
[^22]: [rbb-online.de \(archived\)](https://web.archive.org/web/20220525072528/https://www.rbb-online.de/supermarkt/zusatzmaterial/2021/aktuell-10-2021/behoerden-buergeramt-ausweis-bezirksamt-online-antraege-berlin-brandenburg.html)
[^23]: [welt.de](https://www.welt.de/regionales/berlin/article144567655/Berliner-verkaufen-Termine-im-Buergeramt-fuer-45-Euro.html)
[^24]: [checkpoint.tagesspiegel.de](https://checkpoint.tagesspiegel.de/langmeldung/1nFaSvn04t1eyLagvxeBL4), [20percent.berlin](https://www.20percent.berlin/p/45-yes-more-corona-changes-trains?s=r), [blog.feather-insurance.com](https://blog.feather-insurance.com/meet-nicolas-from-all-about-berlin/)
[^25]: [allaboutberlin.com](/tools/appointment-finder), [linkedin.com](https://www.linkedin.com/posts/nicolasbouliane_b%C3%BCrgeramt-appointment-finder-activity-6891808142745755648-wsvb?utm_source=linkedin_share&utm_medium=member_desktop_web), [Twitter](https://twitter.com/aboutberlin/status/1485999903327367178)
[^26]: This was a problem in [2015](https://www.tagesspiegel.de/berlin/wegen-personalmangels-der-alltaegliche-wahnsinn-an-berliner-buergeraemtern/11758190.html), [2016](https://www.rbb24.de/politik/wahl/berlin/wahlprogramme/buergeraemter-verwaltung-wahlprogramme-berlin-abgeordnetenhaus-wahl.html), [2017](https://www.tagesspiegel.de/berlin/berliner-senat-schafft-50-neue-stellen-schlange-ade-es-gibt-wieder-termine-im-buergeramt/19206014.html), [2018](https://www.morgenpost.de/berlin/article213130353/Buergeramt-Berliner-sollen-Wunschtermin-einfacher-bekommen.html), [2019](https://www.tagesspiegel.de/berlin/personalmangel-und-lange-wartezeiten-innensenator-schlaegt-alarm-wegen-situation-in-berliner-buergeraemtern/24957980.html), [2020](https://www.morgenpost.de/berlin/article230804526/Terminnotstand-in-den-Berliner-Buergeraemtern.html), [2021](https://web.archive.org/web/20220104195144/https://www.rbb24.de/politik/beitrag/2021/06/berlin-terminmangel-laengere-oeffnungszeiten-buergeraemter.html) and [2022](https://www.morgenpost.de/berlin/article233456999/buergeramt-berlin-termin-vorzugstermin-tipps-buergeraemter.html)