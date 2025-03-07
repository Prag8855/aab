from datetime import datetime
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


context = {}

# ==============================================================================
# TAXES
# ==============================================================================

# German minimum wage (€/h)
context['MINIMUM_WAGE'] = fail_on('2025-07-01', 12.82)

# Maximum income used to calculate pension contributions (€/y)
# https://www.tk.de/firmenkunden/versicherung/beitraege-faq/zahlen-und-grenzwerte/beitragsbemessungsgrenzen-2033026
context['BEITRAGSBEMESSUNGSGRENZE'] = fail_on('2025-12-31', 8050 * 12)  # § SGB 6 Anlage 2 [BBGRV]

# Minimum allowance for au pairs (€/mth)
context["AU_PAIR_MIN_ALLOWANCE"] = fail_on('2025-07-01', 280)

context["MEDIAN_INCOME_BERLIN"] = fail_on('2025-12-31', 47784)  # 2023
context["MEDIAN_INCOME_GERMANY"] = fail_on('2025-12-31', 45552)  # 2023

context["VORSORGEPAUSCHAL_MIN"] = fail_on('2025-12-31', 1900)  # §39b Abs. 2.3.e EStG
context["VORSORGEPAUSCHAL_MIN_TAX_CLASS_3"] = 3000,  # ??

context["GRUNDFREIBETRAG"] = fail_on('2025-12-31', 12096)  # § 32a EstG [GFB]

context["INCOME_TAX_TARIF_2_MAX_INCOME"] = fail_on('2025-12-31', 17430)  # § 32a EstG [UPTAB24]
context["INCOME_TAX_TARIF_3_MAX_INCOME"] = fail_on('2025-12-31', 68430)  # § 32a EstG [UPTAB24]
context["INCOME_TAX_TARIF_4_MAX_INCOME"] = fail_on('2025-12-31', 277825)  # § 32a EstG [UPTAB24]

# Upper bound (€/y) of income tax tarif zones for tax classes 5 and 6
context["INCOME_TAX_CLASS_56_LIMIT_1"] = fail_on('2025-12-31', 13785)  # (€/y) - § 39b Abs. 2 Satz 7 EstG [W1STKL5]
context["INCOME_TAX_CLASS_56_LIMIT_2"] = fail_on('2025-12-31', 34240)  # (€/y) - § 39b Abs. 2 Satz 7 EstG [W2STKL5]
context["INCOME_TAX_CLASS_56_LIMIT_3"] = fail_on('2025-12-31', 222260)  # (€/y) - § 39b Abs. 2 Satz 7 EstG [W3STKL5]

context["INCOME_TAX_MAX_RATE"] = 45  # (%) - § 32b EstG

context["CHURCH_TAX_RATE"] = 9  # (%)
context["CHURCH_TAX_RATE_BW_BY"] = 8  # (%)

context["SOLIDARITY_TAX_MILDERUNGSZONE_MIN_INCOME_TAX"] = fail_on('2025-12-31', 19950)  # §3 SolzG 3 [SOLZFREI]
context["SOLIDARITY_TAX_MILDERUNGSZONE_RATE"] = fail_on('2025-12-31', 0.119)  # §3 SolzG 3
context["SOLIDARITY_TAX_MAX_RATE"] = fail_on('2025-12-31', 0.055)  # §3 SolzG 3

context["ARBEITNEHMERPAUSCHALE"] = 1230  # (€/y) - §9a EStG

context["ARBEITSLOSENVERSICHERUNG_EMPLOYEE_RATE"] = 1.3  # § 341 SGB 3, BeiSaV 2019

context["SONDERAUSGABEN_PAUSCHBETRAG"] = 36  # (€/y) §10c EStG [SAP]

# Kindergeld amount per child (€/m) - §6 Abs. 1 BKGG
context["KINDERGELD"] = fail_on('2025-12-31', 255)

# Tax break for parents (€/y) - § 32 Abs. 6 EStG [KFB] - monitored
context["KINDERFREIBETRAG"] = fail_on('2025-12-31', (3336 + 1464) * 2)

# Tax break for single parents (€/y) - § 24b EStG [EFA]
context["ENTLASTUNGSBETRAG_ALLEINERZIEHENDE"] = fail_on('2025-12-31', 4260)
context["ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_EXTRA_CHILD"] = fail_on('2025-12-31', 240)

# Below that amount (€/y), you don't pay Gewerbesteuer - § 11 GewStG
context["GEWERBESTEUER_FREIBETRAG"] = 24500

# Used as the basis, multiplied by the Hebesatz - § 11 GewStG
context["GEWERBESTEUER_MESSBETRAG"] = Decimal('3.5')

context["GEWERBESTEUER_TAX_CREDIT"] = Decimal('3.8')  # TODO: Not watched
context["GEWERBESTEUER_HEBESATZ_BERLIN"] = Decimal('4.1')  # TODO: Not watched

context["KLEINUNTERNEHMER_MAX_INCOME_FIRST_YEAR"] = 25000  # § 19 Abs. 1 UStG
context["KLEINUNTERNEHMER_MAX_INCOME"] = 100000  # § 19 Abs. 1 UStG

# Above that amount (€/y), you must use double entry bookkeeping - § 241a HGB
context["DOUBLE_ENTRY_MIN_REVENUE"] = 800000
context["DOUBLE_ENTRY_MIN_INCOME"] = 80000

# VAT (%) - § 12 UStG (Abs 1 and 2)
context["VAT_RATE"] = 19
context["VAT_RATE_REDUCED"] = 7

# Below 10,000€/y in VAT, simplified rules for intra-EU VAT
context["EU_VAT_SCHWELLENWERT"] = 10000

# Umsatzsteuer-Voranmeldung minimum amounts, based on VAT paid last year (€/year) - § 18 UStG
context["VAT_MIN_QUARTERLY_AMOUNT"] = 1000
context["VAT_MIN_MONTHLY_AMOUNT"] = 7500

context["CAPITAL_GAINS_TAX_RATE"] = 25  # (%) - § 32d EStG
context["CAPITAL_GAINS_FREIBETRAG"] = 1000  # Sparer-Pauschbetrag, § 20 Abs. 9 EStG


# ==============================================================================
# HEALTH INSURANCE
# ==============================================================================

# Below this income (€/mth), you have a minijob
context['MINIJOB_MAX_INCOME'] = round(context['MINIMUM_WAGE'] * 130 / 3)  # § 8 SGB IV

# Below this income (€/mth), you have a midijob - §20 SGB IV
context["MIDIJOB_MAX_INCOME"] = fail_on('2025-12-31', 2000)

# Used to calculate health insurance for a midijob - § 20 SGB IV
context["GKV_FACTOR_F"] = fail_on('2025-12-31', 0.6683)

# Median income (€/m) of all people who pay social contribs
context['BEZUGSGROESSE'] = fail_on('2025-12-31', 3745)  # SGB VI Anlage 1

# Base contribution (%), including Krankengeld
context['GKV_BASE_RATE'] = 14.6  # § 241 SGB V
context['GKV_BASE_RATE_STUDENT'] = context['GKV_BASE_RATE'] * 0.7  # § 245 SGB V

# Base contribution (%), excluding Krankengeld - § 243 SGB V
context["GKV_BASE_RATE_SELF_EMPLOYED"] = 14

# Mindestbemessungsgrundlage (€/mth) - Below this income, GKV does not get cheaper
context['GKV_MIN_INCOME'] = context['BEZUGSGROESSE'] / 90 * 30  # §240 Abs. 4 SGV IV

# Above this income (€/y), you pay the Höchstbeitrag - https://www.bmas.de/DE/Arbeit/Arbeitsrecht/Mindestlohn/mindestlohn.html
context['GKV_MAX_INCOME'] = fail_on('2025-12-31', 5512.50 * 12)  # SVBezGrV 2021 [BBGKVPV]

# Above this income (€/mth), your employer pays for health insurance
context["GKV_AZUBI_FREIBETRAG"] = fail_on('2025-12-31', 325)  # §20 Abs. 3 SGB IV

# Above this income, it's no longer a Nebenjob
context["GKV_NEBENJOB_MAX_INCOME"] = context['BEZUGSGROESSE'] * 0.75

# Jahresarbeitsentgeltgrenze or Versicherungspflichtgrenze - Above this income (€/y), you are freiwillig versichert
context["GKV_FREIWILLIG_VERSICHERT_MIN_INCOME"] = fail_on('2025-12-31', 6150 * 12)

# Above this income (€/m), you can't have Familienversicherung
context['GKV_FAMILIENVERSICHERUNG_MAX_INCOME'] = 1 / 7 * context['BEZUGSGROESSE']  # §10 SGB V

# Zusatzbeiträge - https://www.check24.de/gesetzliche-krankenversicherung/erhoehung-zusatzbeitraege/
context['GKV_MIN_ZUSATZBEITRAG'] = fail_on('2025-12-31', 2.19)  # HKK
context['GKV_MAX_ZUSATZBEITRAG'] = fail_on('2025-12-31', 3.5)  # AOK Nordost
context['GKV_AVG_ZUSATZBEITRAG'] = fail_on('2025-12-31', 2.5)

# https://www.check24.de/gesetzliche-krankenversicherung/erhoehung-zusatzbeitraege/
context["GKV_ZUSATZBEITRAG_AVERAGE"] = context['GKV_AVG_ZUSATZBEITRAG']
context["GKV_ZUSATZBEITRAG_AOK"] = fail_on('2025-12-31', 3.5)
context["GKV_ZUSATZBEITRAG_BARMER"] = fail_on('2025-12-31', 3.29)
context["GKV_ZUSATZBEITRAG_DAK"] = fail_on('2025-12-31', 2.8)
context["GKV_ZUSATZBEITRAG_HKK"] = fail_on('2025-12-31', 2.19)
context["GKV_ZUSATZBEITRAG_TK"] = fail_on('2025-12-31', 2.45)

# Private health insurance lowest cost - NOT TRACKED
# https://www.ottonova.de/v/private-krankenversicherung/angestellte
# https://www.ottonova.de/v/private-krankenversicherung/studenten
# https://www.ottonova.de/v/private-krankenversicherung/selbststaendige
context["OTTONOVA_SELFEMPLOYED_COST"] = fail_on('2025-06-01', 552)  # Premium economy
context["OTTONOVA_STUDENT_COST"] = fail_on('2025-06-01', 111)  # Study smart
context["OTTONOVA_EMPLOYEE_COST"] = fail_on('2025-06-01', 263)  # Premium economy

# Maximum daily Krankengeld
context['GKV_KRANKENGELD_DAILY_LIMIT'] = context['GKV_MAX_INCOME'] * 0.7 / 360  # § 47 SGB V

# BAFöG Bedarfssatz (€/y)
context['BAFOG_BEDARFSSATZ'] = fail_on('2025-07-01', 380 + 475)  # §13 BAföG Abs 1.2 + 2.2

# Pflegeversicherung (%) - §55 Abs. 1 SGB XI
context['PFLEGEVERSICHERUNG_BASE_RATE'] = fail_on('2025-12-31', 3.4)
context["PFLEGEVERSICHERUNG_BASE_RATE_MAX_AGE"] = 22  # § 55 Abs. 1 SGB XI
context["PFLEGEVERSICHERUNG_EMPLOYER_RATE"] = context['PFLEGEVERSICHERUNG_BASE_RATE'] / 2

# Surcharge for people over 23 with no kids
context['PFLEGEVERSICHERUNGS_SURCHARGE'] = 0.6  # §55 Abs. 3 SGB XI
context['PFLEGEVERSICHERUNGS_DISCOUNT_PER_CHILD'] = 0.25  # §55 Abs. 3 SGB XI

context['PFLEGEVERSICHERUNG_DISCOUNT_MIN_CHILDREN'] = 2
context['PFLEGEVERSICHERUNG_DISCOUNT_MAX_CHILDREN'] = 5
context['PFLEGEVERSICHERUNG_MIN_RATE'] = context['PFLEGEVERSICHERUNG_BASE_RATE'] - context['PFLEGEVERSICHERUNGS_DISCOUNT_PER_CHILD'] * (context['PFLEGEVERSICHERUNG_DISCOUNT_MAX_CHILDREN'] - 1)
context['PFLEGEVERSICHERUNG_MAX_RATE'] = context['PFLEGEVERSICHERUNG_BASE_RATE'] + context['PFLEGEVERSICHERUNGS_SURCHARGE']

# ==============================================================================
# PENSIONS
# ==============================================================================

# Public pension contribution (%) - RVBeitrSBek 202X
context['RV_BASE_RATE'] = fail_on('2025-12-31', 18.6)  # RVBeitrSBek 202X
context["RV_EMPLOYEE_CONTRIBUTION"] = fail_on('2025-12-31', 9.3)
context["RV_MIN_CONTRIBUTION"] = context['RV_BASE_RATE'] * context['MINIJOB_MAX_INCOME'] / 100

context["FUNDSBACK_FEE"] = '9.405'
context["FUNDSBACK_MIN_FEE"] = 854.05
context["FUNDSBACK_MAX_FEE"] = 2754.05
context["GERMANYPENSIONREFUND_FEE"] = '9.75'
context["PENSIONREFUNDGERMANY_FEE"] = '10'
context["PENSIONREFUNDGERMANY_MAX_FEE"] = 2800

# Maximum income from employment to stay a member of the KSK (€/y)
context["KSK_MAX_EMPLOYMENT_INCOME"] = context["BEITRAGSBEMESSUNGSGRENZE"] / 2  # § 4 KSVG

# Minimum contribution (€/mth) without employer contribution
context['GKV_MIN_COST'] = round(
    context['GKV_MIN_INCOME'] * (
        context['GKV_BASE_RATE']
        + context['PFLEGEVERSICHERUNG_MIN_RATE']
        + context['GKV_MIN_ZUSATZBEITRAG']
    ) / 100,
    -1
)

# Min/max health insurance rate for employees (%), with avg. Zusatzbeitrag
context["GKV_MIN_RATE_EMPLOYEE"] = round(
    (
        (  # Total rate
            context['GKV_BASE_RATE']
            + context['PFLEGEVERSICHERUNG_MIN_RATE']
            + context['GKV_AVG_ZUSATZBEITRAG']
        )
        - (  # Employer's contribution
            context['GKV_BASE_RATE']
            + context['PFLEGEVERSICHERUNG_BASE_RATE']
            + context['GKV_AVG_ZUSATZBEITRAG']
        ) / 2
    ),
    1
)
context["GKV_MAX_RATE_EMPLOYEE"] = round(
    (
        (  # Total cost
            context['GKV_BASE_RATE']
            + context['PFLEGEVERSICHERUNG_MAX_RATE']
            + context['GKV_AVG_ZUSATZBEITRAG']
        )
        - (  # Employer's contribution
            context['GKV_BASE_RATE']
            + context['PFLEGEVERSICHERUNG_BASE_RATE']
            + context['GKV_AVG_ZUSATZBEITRAG']
        ) / 2
    ),
    1
)

context["GKV_MIN_RATE_SELF_EMPLOYED"] = round(
    context['GKV_BASE_RATE_SELF_EMPLOYED']
    + context['PFLEGEVERSICHERUNG_MIN_RATE']
    + context['GKV_MIN_ZUSATZBEITRAG'],
    1
)
context["GKV_MAX_RATE_SELF_EMPLOYED"] = round(
    context['GKV_BASE_RATE_SELF_EMPLOYED']
    + context['PFLEGEVERSICHERUNG_MAX_RATE']
    + context['GKV_MAX_ZUSATZBEITRAG'],
    1
)

# Min/max health insurance cost for employees (€/mth), with avg. Zusatzbeitrag
context["GKV_MIN_COST_EMPLOYEE"] = round(context['GKV_MIN_INCOME'] * context["GKV_MIN_RATE_EMPLOYEE"] / 100, -1)
context["GKV_MAX_COST_EMPLOYEE"] = round(context['GKV_MAX_INCOME'] / 12 * context["GKV_MAX_RATE_EMPLOYEE"] / 100, -1)

# Maximum health insurance cost for freelancers (€/mth), with avg. Zusatzbeitrag
context["GKV_MAX_COST_SELF_EMPLOYED"] = round(
    context['GKV_MAX_INCOME'] / 12 * (
        context['GKV_BASE_RATE_SELF_EMPLOYED']
        + context['PFLEGEVERSICHERUNG_MAX_RATE']
        + context['GKV_AVG_ZUSATZBEITRAG']
    ) / 100,
    -1
)

# Contribution for students (€/mth), with avg. Zusatzbeitrag
context["GKV_COST_STUDENT"] = round(
    context['BAFOG_BEDARFSSATZ'] * (
        context['GKV_BASE_RATE_STUDENT']
        + context['PFLEGEVERSICHERUNG_MAX_RATE']
        + context['GKV_AVG_ZUSATZBEITRAG']
    ) / 100,
    -1
)


# ==============================================================================
# PUBLIC TRANSIT
# ==============================================================================

context["BVG_AB_TICKET"] = fail_on('2025-12-31', 3.80)
context["BVG_ABC_TICKET"] = fail_on('2025-12-31', 4.70)
context["BVG_FINE"] = fail_on('2025-12-31', 60)
context["BVG_REDUCED_FINE"] = fail_on('2025-12-31', 7)
context["DEUTSCHLAND_TICKET_PRICE"] = fail_on('2025-12-31', 58)


# ==============================================================================
# IMMIGRATION
# ==============================================================================

# Minimum income (€/y) to get a Blue Card - §18g AufenthG
context["BLUE_CARD_MIN_INCOME"] = 0.5 * context['BEITRAGSBEMESSUNGSGRENZE']

# Minimum income (€/y) to get a Blue Card in shortage fields - §18g AufenthG
context["BLUE_CARD_SHORTAGE_MIN_INCOME"] = 0.453 * context['BEITRAGSBEMESSUNGSGRENZE']

# Visa fees (€) - §44, §45, §45c and §47 AufenthV
context["SCHENGEN_VISA_FEE"] = 75
context["NATIONAL_VISA_FEE"] = 100
context["NATIONAL_VISA_RENEWAL_FEE"] = 96
context["RESIDENCE_PERMIT_REPLACEMENT_FEE"] = 67  # After a passport change (€) - §45c AufenthG
context["MIN_PERMANENT_RESIDENCE_FEE"] = 37  # For Turkish citizens
context["MAX_PERMANENT_RESIDENCE_FEE"] = 147  # §44 AufenthG
context["FAST_TRACK_FEE"] = 411  # §47 AufenthG

# Minimum guaranteed pension payment (€/m) to get a freelance visa above age 45
# VAB, https://www.bmas.de/DE/Soziales/Rente-und-Altersvorsorge/rentenversicherungsbericht-art.html
context['FREELANCE_VISA_MIN_MONTHLY_PENSION'] = fail_on('2025-12-31', 1565.03)
context["FREELANCE_VISA_MIN_PENSION"] = round(context['FREELANCE_VISA_MIN_MONTHLY_PENSION'] * 144)

# Minimum income (€/mth) before health insurance and rent to get a freelance visa - Anlage SGB 12 (Regelbedarfsstufe 1)
context["FREELANCE_VISA_MIN_INCOME"] = fail_on('2025-12-31', 563)

# Minimum gross income (€/y) to get a work visa above age 45 - service.berlin.de/dienstleistung/305304
context["WORK_VISA_MIN_INCOME"] = context['BEITRAGSBEMESSUNGSGRENZE'] * 0.55

# Not watched - https://www.berlin.de/vhs-tempelhof-schoeneberg/kurse/deutsch-als-zweitsprache/pruefungen-und-abschluesse/einbuergerung/
context["CITIZENSHIP_TEST_FEE"] = fail_on('2025-12-31', 25)

# Nationalities that can apply for a residence permit directly in Germany - §41 AufenthV
beschv_26_1_countries = ["Australia", "Canada", "Israel", "Japan", "Monaco", "New Zealand", "San Marino", "South Korea", "the United Kingdom", "the United States"]
beschv_26_2_countries = ["Albania", "Bosnia-Herzegovina", "Kosovo", "North Macedonia", "Montenegro", "Serbia"]
context["BESCHV_26_COUNTRIES"] = or_join(sorted(beschv_26_1_countries + beschv_26_2_countries))
context["BESCHV_26_1_COUNTRIES"] = or_join(beschv_26_1_countries)
context["BESCHV_26_2_COUNTRIES"] = or_join(beschv_26_2_countries)

# Exempt from freelance visa pension requirement
context['AUFENTHG_21_2_COUNTRIES'] = or_join([
    "the Dominican Republic",
    "Indonesia",
    # "Iran",  # Missing from VAB since at least 2018
    "Japan",
    "Philippines",
    "Sri Lanka",
    "Turkey",
    "the United States",
])

# Visa-free entry to apply for a residence permit
context["AUFENTHV_41_COUNTRIES"] = or_join([
    "Australia",
    "Canada",
    "Israel",
    "Japan",
    "New Zealand",
    "South Korea",
    "the United Kingdom",
    "the United States",
])


# ==============================================================================
# ADMINISTRATION
# ==============================================================================

context["BESCHEINIGUNG_IN_STEUERSACHEN_FEE"] = 17.90  # (€) - service.berlin.de/dienstleistung/324713
context["DRIVING_LICENCE_CONVERSION_FEE"] = 37.50  # (€) - service.berlin.de/dienstleistung/327537
context["DRIVING_LICENCE_FEE"] = 51.81  # (€) - service.berlin.de/dienstleistung/121627
context["GEWERBEANMELDUNG_FEE"] = 15  # € - service.berlin.de/dienstleistung/121921
context["HUNDEFUHRERSCHEIN_FEE"] = 94  # (€) - service.berlin.de/dienstleistung/121822
context["HUNDEREGISTER_FEE"] = 17.50  # € - hunderegister.berlin.de
context["HUNDESTEUER_FIRST_DOG"] = 120  # §4 HuStG BE, (€/y)
context["HUNDESTEUER_MORE_DOGS"] = 180  # §4 HuStG BE, (€/y)
context["KSK_MIN_INCOME"] = fail_on('2025-12-31', 3900)  # (€/y) - §3 Abs. 1 KSVG
context["ORDNUNGSAMT_DANGEROUS_DOG_FEE"] = 30  # service.berlin.de/dienstleistung/326263
context["RUNDFUNKBEITRAG_FEE"] = 18.36
context["SCHUFA_REPORT_FEE"] = fail_on('2025-07-01', 29.95)  # TODO: Not watched
context["VEHICLE_UMMELDUNG_FEE"] = 10.80  # service.berlin.de/dienstleistung/120658

config.context_globals = {
    'now': datetime.now(),
    'site_url': config.site_url,
    'random_id': random_id,
    'fail_on': fail_on,
    'google_maps_api_key': 'AIzaSyBtGlbcvFspb9habWlXiFcptF8wdFjCb-E',  # Frontend use
    'glossary_groups': glossary_groups,
    **context,
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
