from datetime import datetime, date
from decimal import Decimal
from extensions.functions import glossary_groups
from logtail import LogtailHandler
from markdown.extensions.toc import slugify
from pathlib import Path
from typing import Any
from ursus.config import config
import logging
import os
import secrets
import string
import urllib


def to_number(value: int) -> str:
    return "{:,}".format(value) if value else ''


def to_currency(value: int) -> str:
    return "{:0,.2f}".format(value).replace('.00', '') if value else ''


def random_id() -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(5))


def build_wikilinks_url(label: str, base: str, end: str) -> str:
    return '{}{}{}'.format(base, urllib.parse.quote(label), end)


def patched_slugify(value: str, separator: str, keep_unicode: bool = False) -> str:
    """
    Removes leading numbers from slugs
    """
    return slugify(value.lstrip(' 0123456789'), separator, keep_unicode)


def fail_on(expiration_date: str, value: Any | None = None) -> Any:
    # Fails when the expiration date is reached. Used to set content date limits.
    assert datetime.strptime(expiration_date, "%Y-%m-%d") >= datetime.now(), f"Content expired on {expiration_date}"
    return '' if value is None else value


def or_join(items: list[str]) -> str:
    return ', '.join(items[:-1]) + ' or ' + items[-1]


config.content_path = Path(__file__).parent / 'content'
config.templates_path = Path(__file__).parent / 'templates'
config.output_path = Path(__file__).parent.parent / 'output'

config.site_url = os.environ.get('SITE_URL', '')
config.html_url_extension = ''

config.lunr_indexes = {
    'indexed_fields': ('title', 'short_title', 'description', 'german_term', 'english_term',),
    'indexes': [
        {
            'uri_pattern': 'guides/*.md',
            'returned_fields': ('title', 'short_title', 'url', ),
            'boost': 2,
        },
        {
            'uri_pattern': 'glossary/*.md',
            'returned_fields': ('title', 'english_term', 'german_term', 'url', ),
            'boost': 1,
        },
        {
            'uri_pattern': 'docs/*.md',
            'returned_fields': ('title', 'english_term', 'german_term', 'url', ),
            'boost': 1,
        },
        {
            'uri_pattern': 'tools/*.md',
            'returned_fields': ('title', 'url', ),
            'boost': 1,
        },
        {
            'uri_pattern': 'contact.md',
            'returned_fields': ('title', 'url',),
            'boost': 2,
        },
        {
            'uri_pattern': 'terms.md',
            'returned_fields': ('title', 'url',),
            'boost': 0.5,
        },
    ]
}

config.image_default_sizes = '(min-width: 800px) 800px, 100vw'
config.image_transforms = {
    '': {
        'exclude': ('experts/photos/*', ),
        'max_size': (int(800 * 2), int(800 * 2 * 1.5)),
        'output_types': ('webp', 'original'),
    },
    'content1.5x': {
        'include': ('images/*', 'illustrations/*'),
        'exclude': ('*.pdf', '*.svg'),
        'max_size': (int(800 * 1.5), int(800 * 1.5 * 1.5)),
        'output_types': ('webp', 'original'),
    },
    'content1x': {
        'include': ('images/*', 'illustrations/*'),
        'exclude': ('*.pdf', '*.svg'),
        'max_size': (800, int(800 * 1.5)),
        'output_types': ('webp', 'original'),
    },
    'content0.75x': {
        'include': ('images/*', 'illustrations/*'),
        'exclude': ('*.pdf', '*.svg'),
        'max_size': (int(800 * 0.75), int(800 * 0.75 * 1.5)),
        'output_types': ('webp', 'original'),
    },
    'content0.5x': {
        'include': ('images/*', 'illustrations/*'),
        'exclude': ('*.pdf', '*.svg'),
        'max_size': (int(800 * 0.5), int(800 * 0.5 * 1.5)),
        'output_types': ('webp', 'original'),
    },
    'bioLarge2x': {
        'include': 'experts/photos/*',
        'max_size': (250, 250),
    },
    'bioLarge1x': {
        'include': 'experts/photos/*',
        'max_size': (125, 125),
    },
    'bio2x': {
        'include': 'experts/photos/*',
        'max_size': (150, 150),
    },
    'bio1x': {
        'include': 'experts/photos/*',
        'max_size': (75, 75),
    },
    'previews': {
        'include': 'documents/*',
        'max_size': (300, 600),
        'output_types': ('webp', 'png'),
    },
    'previews2x': {
        'include': 'documents/*',
        'max_size': (600, 1200),
        'output_types': ('webp', 'png'),
    },
}

config.context_processors.extend([
    'extensions.renderers.entry_images.EntryImageUrlProcessor',
    'ursus.context_processors.git_date.GitDateProcessor',
    'extensions.context_processors.hyphenated_titles.HyphenatedTitleProcessor',
])

config.markdown_extensions['toc']['slugify'] = patched_slugify
config.markdown_extensions['wikilinks']['base_url'] = f'{config.site_url}/glossary/'
config.markdown_extensions['wikilinks']['build_url'] = build_wikilinks_url
config.markdown_extensions['tasklist']['list_item_class'] = 'checkbox'
config.add_markdown_extension('extensions.markdown:WrappedTableExtension', {'wrapper_class': 'table-wrapper'})
config.add_markdown_extension('extensions.markdown:ArrowLinkIconExtension')
config.add_markdown_extension('extensions.markdown:CurrencyExtension')
config.add_markdown_extension('extensions.markdown:HyphenatedTitleExtension')
config.add_markdown_extension('extensions.markdown:TypographyExtension')

config.renderers.extend([
    'extensions.renderers.entry_images.EntryImageRenderer',
    'extensions.renderers.nginx_map.NginxMapRenderer',
    'extensions.renderers.glossary_audio.GlossaryAudioRenderer',
])

config.linters = [
    # 'extensions.linters.places.PlacesLinter',
    # 'ursus.linters.markdown.MarkdownExternalLinksLinter',
    # 'extensions.linters.redirects.RedirectsLinter',
    'extensions.linters.footnotes.CitationNeededLinter',
    'extensions.linters.footnotes.FootnoteLocationLinter',
    'extensions.linters.footnotes.QuestionMarkLinter',
    'extensions.linters.internal_links.MarkdownInternalLinksLinter',
    'extensions.linters.lists.MultilineListsLinter',
    'extensions.linters.metadata.DateUpdatedLinter',
    'extensions.linters.metadata.ShortTitleLinter',
    'extensions.linters.places.UnusedPlacesLinter',
    'extensions.linters.table_of_contents.TableOfContentsLinter',
    'extensions.linters.wikilinks.WikilinksLinter',
    # 'extensions.linters.titles.DuplicateTitlesLinter',
    'extensions.linters.titles.SequentialTitlesLinter',
    'ursus.linters.footnotes.OrphanFootnotesLinter',
    'ursus.linters.images.UnusedImagesLinter',
    'ursus.linters.markdown.MarkdownLinkTextsLinter',
    'ursus.linters.markdown.MarkdownLinkTitlesLinter',
    'ursus.linters.markdown.RelatedEntriesLinter',
]

config.minify_js = True
config.minify_css = True

config.google_maps_api_key = 'AIzaSyAhhCuZjNCFo2o84w27Xh0ravLwIiVProo'  # Backend use only

config.google_tts_api_key = 'AIzaSyAhhCuZjNCFo2o84w27Xh0ravLwIiVProo'

minimum_wage = fail_on('2025-07-01', 12.82)

# § SGB 6 Anlage 2 - https://www.tk.de/firmenkunden/versicherung/beitraege-faq/zahlen-und-grenzwerte/beitragsbemessungsgrenzen-2033026
beitragsbemessungsgrenze = fail_on('2025-12-31', 8050 * 12)

# https://www.bmas.de/DE/Arbeit/Arbeitsrecht/Mindestlohn/mindestlohn.html
gkv_hoechstbeitrag_min_income = fail_on('2025-12-31', 5512.50 * 12)

# Below this income (€/mth), you have a minijob - § 8 SGB IV
geringfuegigkeitsgrenze = round(minimum_wage * 130 / 3)

# Median income (€/m) of all people who pay social contribs - SGB VI Anlage 1
bezugsgroesse = fail_on('2025-12-31', 3745)

# Base contribution (%), including Krankengeld - § 241 SGB V
health_insurance_base_rate = 14.6

# Base contribution (%) for students - § 245 SGB V
health_insurance_base_rate_student = health_insurance_base_rate * 0.7

# Public pension contribution (%) - RVBeitrSBek 202X
pension_insurance_base_rate = fail_on('2025-12-31', 18.6)

# BAFöG Bedarfssatz (€/y) - sum of §13 BAföG Abs 1.2 + 2.2
bafog_bedarfssatz = fail_on('2025-07-01', 380 + 475)

# Pflegeversicherung (%) - §55 Abs. 1 SGB XI
pflegeversicherung_base_rate = fail_on('2025-12-31', 3.6)

# Surcharge for people over 23 with no kids - §55 Abs. 3 SGB XI
pflegeversicherungs_surcharge = 0.6

# Pflegeversicherung discount per child (%) - §55 Abs. 3 SGB XI
pflegeversicherungs_discount_per_child = 0.25

pflegeversicherung_min_rate = pflegeversicherung_base_rate + pflegeversicherungs_discount_per_child * 4
pflegeversicherung_max_rate = pflegeversicherung_base_rate + pflegeversicherungs_surcharge

# Zusatzbeiträge - https://www.check24.de/gesetzliche-krankenversicherung/erhoehung-zusatzbeitraege/
health_insurance_min_zusatzbeitrag = fail_on('2025-12-31', 2.19)  # HKK
health_insurance_max_zusatzbeitrag = fail_on('2025-12-31', 3.5)  # AOK Nordost
health_insurance_avg_zusatzbeitrag = fail_on('2025-12-31', 2.5)

# Mindestbemessungsgrundlage (€/mth) - §240 Abs. 4 SGV IV
health_insurance_min_income = bezugsgroesse / 90 * 30

# VAB, https://www.bmas.de/DE/Soziales/Rente-und-Altersvorsorge/rentenversicherungsbericht-art.html
freelance_visa_min_monthly_pension = fail_on('2025-12-31', 1565.03)

aufenthv_41_countries = [
    "Australia",
    "Canada",
    "Israel",
    "Japan",
    "New Zealand",
    "South Korea",
    "the United Kingdom",
    "the United States",
]

beschv_26_1_countries = [
    "Australia",
    "Canada",
    "Israel",
    "Japan",
    "Monaco",
    "New Zealand",
    "San Marino",
    "South Korea",
    "the United Kingdom",
    "the United States",
]

beschv_26_2_countries = [
    "Albania",
    "Bosnia-Herzegovina",
    "Kosovo",
    "North Macedonia",
    "Montenegro",
    "Serbia",
]

aufenthg_21_2_countries = [  # Exempt from freelance visa pension requirement
    "the Dominican Republic",
    "Indonesia",
    # "Iran",  # Missing from VAB since at least 2018
    "Japan",
    "Philippines",
    "Sri Lanka",
    "Turkey",
    "the United States",
]

config.context_globals = {
    'now': datetime.now(),
    'site_url': config.site_url,
    'random_id': random_id,
    'fail_on': fail_on,
    'google_maps_api_key': 'AIzaSyBtGlbcvFspb9habWlXiFcptF8wdFjCb-E',  # Frontend use
    'glossary_groups': glossary_groups,

    # ==============================================================================
    # HEALTH INSURANCE
    # ==============================================================================

    # Mindestbemessungsgrundlage (€/mth) - §240 Abs. 4 SGV IV
    "GKV_MIN_INCOME": health_insurance_min_income,

    # Jahresarbeitsentgeltgrenze or Versicherungspflichtgrenze - Above this income (€/y), you are freiwillig versichert
    "GKV_FREIWILLIG_VERSICHERT_MIN_INCOME": fail_on('2025-12-31', 6150 * 12),

    # Above this income (€/mth), your employer pays for health insurance - §20 SGB IV
    "GKV_AZUBI_FREIBETRAG": fail_on('2025-01-31', 325),

    # Above this income, it's no longer a Nebenjob
    "GKV_NEBENJOB_MAX_INCOME": bezugsgroesse * 0.75,

    # Besondere Versicherungspflichtgrenze - Above this income (€/y), you pay the Höchstbeitrag - SVBezGrV 2021 [BBGKVPV]
    "GKV_HÖCHSTBEITRAG_MIN_INCOME": gkv_hoechstbeitrag_min_income,

    # Maximum daily Krankengeld - § 47 SGB V
    "GKV_KRANKENGELD_DAILY_LIMIT": gkv_hoechstbeitrag_min_income * 0.7 / 360,

    # Above this income (€/m), you can't have Familienversicherung - §10 SGB V
    "GKV_FAMILIENVERSICHERUNG_MAX_INCOME": 1 / 7 * bezugsgroesse,

    # Base contribution (%), including Krankengeld - § 241 SGB V
    "GKV_BASE_RATE": health_insurance_base_rate,

    # Base contribution (%) for students - § 245 SGB V
    "GKV_BASE_RATE_STUDENT": health_insurance_base_rate_student,

    # Base contribution (%), excluding Krankengeld - § 243 SGB V
    "GKV_SELF_EMPLOYED_BASE_RATE": 14,

    # Estimated minimum contribution (€/mth) without employer contribution
    "GKV_MIN_COST": round(
        health_insurance_min_income * (
            health_insurance_base_rate
            + pflegeversicherung_min_rate
            + health_insurance_min_zusatzbeitrag
        ) / 100,
        -1
    ),

    # Maximum health insurance cost for employees (€/mth), with avg. Zusatzbeitrag
    "GKV_MAX_COST_EMPLOYEE": round(
        gkv_hoechstbeitrag_min_income / 12 * (
            health_insurance_base_rate
            + pflegeversicherung_max_rate
            + health_insurance_avg_zusatzbeitrag
        ) / 100
        / 2,
        -1
    ),

    # Maximum health insurance cost for freelancers (€/mth), with avg. Zusatzbeitrag
    "GKV_MAX_COST_SELF_EMPLOYED": round(
        gkv_hoechstbeitrag_min_income / 12 * (
            health_insurance_base_rate
            + pflegeversicherung_max_rate
            + health_insurance_avg_zusatzbeitrag
        ) / 100,
        -1
    ),

    # Contribution for students (€/mth), with average Zusatzbeitrag
    "GKV_COST_STUDENT": round(
        bafog_bedarfssatz * (
            health_insurance_base_rate_student
            + pflegeversicherung_max_rate
            + health_insurance_avg_zusatzbeitrag
        ) / 100,
        -1
    ),

    # Used to calculate health insurance for a midijob - § 20 SGB IV
    "GKV_FACTOR_F": fail_on('2025-12-31', 0.6683),

    # Not quite accurate, but good enough
    "GKV_MIN_EMPLOYEE_RATE": round(
        (
            health_insurance_base_rate
            + pflegeversicherung_min_rate
            + health_insurance_min_zusatzbeitrag
        ) / 2,
        1
    ),
    "GKV_MAX_RATE_EMPLOYEE": round(
        (
            health_insurance_base_rate
            + pflegeversicherung_max_rate
            + health_insurance_max_zusatzbeitrag
        ) / 2,
        1
    ),
    "GKV_MIN_FREELANCER_RATE": round(
        health_insurance_base_rate
        + pflegeversicherung_min_rate
        + health_insurance_min_zusatzbeitrag,
        1
    ),
    "GKV_MAX_RATE_SELF_EMPLOYED": round(
        health_insurance_base_rate
        + pflegeversicherung_max_rate
        + health_insurance_max_zusatzbeitrag,
        1
    ),

    # Private health insurance lowest cost - NOT TRACKED
    # https://www.ottonova.de/v/private-krankenversicherung/angestellte
    # https://www.ottonova.de/v/private-krankenversicherung/studenten
    # https://www.ottonova.de/v/private-krankenversicherung/selbststaendige
    "OTTONOVA_SELFEMPLOYED_COST": 552,  # Premium economy
    "OTTONOVA_STUDENT_COST": 111,  # Study smart
    "OTTONOVA_EMPLOYEE_COST": 263,  # Premium economy

    "PFLEGEVERSICHERUNG_WITH_SURCHARGE": pflegeversicherung_max_rate,

    # Pflegeversicherung (%) - § 55 Abs. 1 SGB XI
    "PFLEGEVERSICHERUNG_NO_SURCHARGE": pflegeversicherung_base_rate,
    "PFLEGEVERSICHERUNG_DISCOUNT_PER_CHILD": pflegeversicherungs_discount_per_child,
    "PFLEGEVERSICHERUNG_NO_SURCHARGE_MAX_AGE": 22,

    "BAFOG_BEDARFSSATZ": bafog_bedarfssatz,

    # Minimum income (€/y) to join the Künstlersozialkasse - § 3 Abs. 1 KSVG
    "KSK_MIN_INCOME": fail_on('2025-12-31', 3900),

    # Zusatzbeiträge - https://www.check24.de/gesetzliche-krankenversicherung/erhoehung-zusatzbeitraege/
    "GKV_ZUSATZBEITRAG_AVERAGE": health_insurance_avg_zusatzbeitrag,
    "GKV_ZUSATZBEITRAG_AOK": fail_on('2025-12-31', 3.5),
    "GKV_ZUSATZBEITRAG_BARMER": fail_on('2025-12-31', 3.29),
    "GKV_ZUSATZBEITRAG_DAK": fail_on('2025-12-31', 2.8),
    "GKV_ZUSATZBEITRAG_HKK": fail_on('2025-12-31', 2.19),
    "GKV_ZUSATZBEITRAG_TK": fail_on('2025-12-31', 2.45),

    # ==============================================================================
    # IMMIGRATION
    # ==============================================================================

    # Minimum income (€/y) to get a Blue Card - §18g AufenthG
    "BLUE_CARD_MIN_INCOME": 0.5 * beitragsbemessungsgrenze,

    # Minimum income (€/y) to get a Blue Card in shortage fields - §18g AufenthG
    "BLUE_CARD_SHORTAGE_MIN_INCOME": 0.453 * beitragsbemessungsgrenze,

    # Visa fees (€) - §44, §45, §45c and §47 AufenthV
    "SCHENGEN_VISA_FEE": 75,
    "NATIONAL_VISA_FEE": 100,
    "NATIONAL_VISA_RENEWAL_FEE": 96,
    "RESIDENCE_PERMIT_REPLACEMENT_FEE": 67,  # After a passport change (€) - §45c AufenthV
    "MIN_PERMANENT_RESIDENCE_FEE": 37,  # For Turkish citizens
    "MAX_PERMANENT_RESIDENCE_FEE": 147,  # §44 AufenthV
    "FAST_TRACK_FEE": 411,  # §47 AufenthV

    # Minimum guaranteed pension payment (€/m) to get a freelance visa above age 45
    "FREELANCE_VISA_MIN_MONTHLY_PENSION": freelance_visa_min_monthly_pension,
    "FREELANCE_VISA_MIN_PENSION": round(freelance_visa_min_monthly_pension * 144),

    # Minimum income (€/mth) before health insurance and rent to get a freelance visa - Anlage SGB 12 (Regelbedarfsstufe 1)
    "FREELANCE_VISA_MIN_INCOME": fail_on('2025-12-31', 563),

    # Minimum gross income (€/y) to get a work visa above age 45 - service.berlin.de/dienstleistung/305304
    "WORK_VISA_MIN_INCOME": beitragsbemessungsgrenze * 0.55,

    # Nationalities that can apply for a residence permit directly in Germany - §41 AufenthV
    "AUFENTHG_21_2_COUNTRIES": or_join(aufenthg_21_2_countries),
    "AUFENTHV_41_COUNTRIES": or_join(aufenthv_41_countries),
    "BESCHV_26_COUNTRIES": or_join(sorted(beschv_26_1_countries + beschv_26_2_countries)),
    "BESCHV_26_1_COUNTRIES": or_join(beschv_26_1_countries),
    "BESCHV_26_2_COUNTRIES": or_join(beschv_26_2_countries),

    # ==============================================================================
    # TAXES
    # ==============================================================================

    # German minimum wage (€/h)
    "MINIMUM_WAGE": minimum_wage,

    # Minimum allowance for au pairs (€/mth)
    "AU_PAIR_MIN_ALLOWANCE": fail_on('2025-07-01', 280),

    # Below this income (€/mth), you have a minijob - § 8 SGB IV
    "MINIJOB_MAX_INCOME": geringfuegigkeitsgrenze,

    # Below this income (€/mth), you have a midijob - §20 SGB IV
    "MIDIJOB_MAX_INCOME": fail_on('2025-12-31', 2000),

    # Median income (€/y) - rounded
    "MEDIAN_INCOME_BERLIN": fail_on('2025-12-31', 47784),  # 2023
    "MEDIAN_INCOME_GERMANY": fail_on('2025-12-31', 45552),  # 2023

    # Public pension contribution (%) - RVBeitrSBek 202X
    "RENTENVERSICHERUNG_EMPLOYEE_CONTRIBUTION": fail_on('2025-12-31', 9.3),
    "RENTENVERSICHERUNG_TOTAL_CONTRIBUTION": pension_insurance_base_rate,
    "RENTENVERSICHERUNG_MIN_CONTRIBUTION": pension_insurance_base_rate * geringfuegigkeitsgrenze / 100,

    # Minimum Vorsorgepauschale - §39b Abs. 2.3.e EStG
    "VORSORGEPAUSCHAL_MIN": fail_on('2025-12-31', 1900),
    "VORSORGEPAUSCHAL_MIN_TAX_CLASS_3": 3000,  # ???

    # Grundfreibetrag (€/y) - § 32a EstG [GFB]
    "GRUNDFREIBETRAG": fail_on('2025-12-31', 12096),

    # Upper bound (€/y) of income tax tarif zones 2, 3 and 4 - § 32a EstG [UPTAB24]
    "INCOME_TAX_TARIF_2_MAX_INCOME": fail_on('2025-12-31', 17430),
    "INCOME_TAX_TARIF_3_MAX_INCOME": fail_on('2025-12-31', 68430),
    "INCOME_TAX_TARIF_4_MAX_INCOME": fail_on('2025-12-31', 277825),

    # Upper bound (€/y) of income tax tarif zones for tax classes 5 and 6 - § 39b Abs. 2 Satz 7 EstG [W1STKL5][W2STKL5][W3STKL5]
    "INCOME_TAX_CLASS_56_LIMIT_1": fail_on('2025-12-31', 13785),
    "INCOME_TAX_CLASS_56_LIMIT_2": fail_on('2025-12-31', 34240),
    "INCOME_TAX_CLASS_56_LIMIT_3": fail_on('2025-12-31', 222260),

    # Maximum income tax rate - § 32b EstG
    "INCOME_TAX_MAX_RATE": 45,

    # Church tax rate as percentage of income tax
    "CHURCH_TAX_RATE": 9,
    "CHURCH_TAX_RATE_BW_BY": 8,

    # Above that income tax amount, you pay a 11.9% solidarity tax (€/y) - §3 SolzG 3 [SOLZFREI]
    "SOLIDARITY_TAX_MILDERUNGSZONE_MIN_INCOME_TAX": fail_on('2025-12-31', 19950),
    "SOLIDARITY_TAX_MILDERUNGSZONE_RATE": fail_on('2025-12-31', 0.119),
    "SOLIDARITY_TAX_MAX_RATE": fail_on('2025-12-31', 0.055),

    # (€/y) - §9a EStG
    "ARBEITNEHMERPAUSCHALE": 1230,

    # The employee's contribution (%) for Arbeitslosenversicherung - § 341 SGB 3, BeiSaV 2019
    "ARBEITSLOSENVERSICHERUNG_EMPLOYEE_RATE": 1.3,

    # Maximum income used to calculate pension contributions (€/y) [BBGRV] - § SGB 6, Anlage 2
    "BEITRAGSBEMESSUNGSGRENZE_EAST": beitragsbemessungsgrenze,
    "BEITRAGSBEMESSUNGSGRENZE": beitragsbemessungsgrenze,

    # Maximum income from employment to stay a member of the KSK (€/y) - § 4 KSVG
    "KSK_MAX_EMPLOYMENT_INCOME": beitragsbemessungsgrenze / 2,

    # (€/y) §10c EStG [SAP]
    "SONDERAUSGABEN_PAUSCHBETRAG": 36,

    # Kindergeld amount per child (€/m) - §6 Abs. 1 BKGG
    "KINDERGELD": fail_on('2025-12-31', 255),

    # Tax break for parents (€/y) - § 32 Abs. 6 EStG [KFB] - monitored
    "KINDERFREIBETRAG": fail_on('2025-12-31', (3336 + 1464) * 2),

    # Tax break for single parents (€/y) - § 24b EStG [EFA]
    "ENTLASTUNGSBETRAG_ALLEINERZIEHENDE": fail_on('2025-12-31', 4260),
    "ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_EXTRA_CHILD": fail_on('2025-12-31', 240),

    # Below that amount (€/y), you don't pay Gewerbesteuer - § 11 GewStG
    "GEWERBESTEUER_FREIBETRAG": 24500,

    # Used as the basis, multiplied by the Hebesatz - § 11 GewStG
    "GEWERBESTEUER_MESSBETRAG": Decimal('3.5'),

    # Not watched
    "GEWERBESTEUER_TAX_CREDIT": Decimal('3.8'),
    "GEWERBESTEUER_HEBESATZ_BERLIN": Decimal('4.1'),

    # Above that amount (€/y), you are no longer a Kleinunternehmer - § 19 Abs. 1 UStG
    "KLEINUNTERNEHMER_MAX_INCOME_FIRST_YEAR": 25000,
    "KLEINUNTERNEHMER_MAX_INCOME": 100000,

    # Above that amount (€/y), you must use double entry bookkeeping - § 241a HGB
    "DOUBLE_ENTRY_MIN_REVENUE": 800000,
    "DOUBLE_ENTRY_MIN_INCOME": 80000,

    # (€/m) - monitored
    "RUNDFUNKBEITRAG_FEE": 18.36,

    # Fee to change the address on your vehicle papers - service.berlin.de/dienstleistung/120658
    "VEHICLE_UMMELDUNG_FEE": 10.80,

    # VAT (%) - § 12 UStG (Abs 1 and 2)
    "VAT_RATE": 19,
    "VAT_RATE_REDUCED": 7,

    # Below 10,000€/y in VAT, simplified rules for intra-EU VAT
    "EU_VAT_SCHWELLENWERT": 10000,

    # Umsatzsteuer-Voranmeldung minimum amounts, based on VAT paid last year (€/year) - § 18 UStG
    "VAT_MIN_QUARTERLY_AMOUNT": 1000,
    "VAT_MIN_MONTHLY_AMOUNT": 7500,

    # Capital gains tax - § 32d EStG
    "CAPITAL_GAINS_TAX_RATE": 25,
    # Sparer-Pauschbetrag, § 20 Abs. 9 EStG
    "CAPITAL_GAINS_FREIBETRAG": 1000,

    # ==============================================================================
    # PUBLIC TRANSIT
    # ==============================================================================

    # € - monitored
    "BVG_AB_TICKET": 3.80,
    "BVG_ABC_TICKET": 4.70,
    "BVG_FINE": 60,
    "BVG_REDUCED_FINE": 7,
    "DEUTSCHLAND_TICKET_PRICE": fail_on('2025-12-31', 58),

    # ==============================================================================
    # ADMINISTRATION
    # ==============================================================================

    # € - service.berlin.de/dienstleistung/121921
    "GEWERBEANMELDUNG_FEE": 15,

    # € - hunderegister.berlin.de
    "HUNDEREGISTER_FEE": 17.50,

    # € - service.berlin.de/dienstleistung/324713
    "BESCHEINIGUNG_IN_STEUERSACHEN_FEE": 17.90,

    # Dog tax (€/y) - §4 HuStG BE
    "HUNDESTEUER_FIRST_DOG": 120,
    "HUNDESTEUER_MORE_DOGS": 180,

    # Fee for registering dangerous breeds - service.berlin.de/dienstleistung/326263
    "ORDNUNGSAMT_DANGEROUS_DOG_FEE": 30,

    # (€) - service.berlin.de/dienstleistung/121822
    "HUNDEFUHRERSCHEIN_FEE": 94,

    # (€) - service.berlin.de/dienstleistung/121627
    "DRIVING_LICENCE_FEE": 49.80,

    # (€) - https://service.berlin.de/dienstleistung/327537/
    "DRIVING_LICENCE_CONVERSION_FEE": 36.30,

    # (€) - https://www.meineschufa.de/, https://bonitaetscheck.immobilienscout24.de/
    "SCHUFA_REPORT_FEE": fail_on('2025-07-01', 29.95),

    # ==============================================================================
    # PENSION_REFUNDS
    # ==============================================================================

    # (%)
    "FUNDSBACK_FEE": '9.405',
    "FUNDSBACK_MIN_FEE": 854.05,
    "FUNDSBACK_MAX_FEE": 2754.05,
    "GERMANYPENSIONREFUND_FEE": '9.75',
    "PENSIONREFUNDGERMANY_FEE": '10',
    "PENSIONREFUNDGERMANY_MAX_FEE": 2800,
}

config.jinja_filters = {
    'number': to_number,
    'num': to_number,
    'currency': to_currency,
    'cur': to_currency,
}

log_handlers = [logging.StreamHandler(), ]
if os.environ.get('BETTERSTACK_SOURCE_TOKEN'):
    log_handlers.append(LogtailHandler(source_token=os.environ['BETTERSTACK_SOURCE_TOKEN']))

config.logging = {
    'level': logging.INFO,
    'format': '%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s',
    'handlers': log_handlers
}
