from pathlib import Path
from datetime import datetime
import logging

logging.addLevelName(logging.DEBUG, '⚪')
logging.addLevelName(logging.INFO, '🟢')
logging.addLevelName(logging.WARNING, '⚠️')
logging.addLevelName(logging.ERROR, '❎')
logging.addLevelName(logging.CRITICAL, '🆘')


def to_number(value):
    return "{:,}".format(value) if value else ''


def to_currency(value):
    return "{:0,.2f}".format(value).replace('.00', '') if value else ''


minimum_wage = 12


config = {
    'generators': [
        (
            'ursus.generators.static.StaticSiteGenerator', {
                'file_context_processors': [
                    'ursus.context_processors.markdown.MarkdownProcessor',
                ],
                'context_processors': [
                    'ursus.context_processors.index.IndexProcessor',
                    'ursus.context_processors.related.RelatedEntriesProcessor',
                ],
                'renderers': [
                    'ursus.renderers.image.ImageTransformRenderer',
                    'ursus.renderers.static.StaticAssetRenderer',
                    'ursus.renderers.jinja.JinjaRenderer',
                ],
                'content_path': Path(__file__).parent / 'content',
                'templates_path': Path(__file__).parent / 'templates',
                'output_path': Path(__file__).parent / 'output',

                'image_transforms': {
                    '': {
                        'max_size': (int(800 * 2), int(800 * 2 * 1.5)),
                    },
                    'content1.5x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (int(800 * 1.5), int(800 * 1.5 * 1.5)),
                    },
                    'content1x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (800, int(800 * 1.5)),
                    },
                    'content0.75x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (int(800 * 0.75), int(800 * 0.75 * 1.5)),
                    },
                    'content0.5x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (int(800 * 0.5), int(800 * 0.5 * 1.5)),
                    },
                    'bio2x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (150, 150),
                    },
                    'bio1x': {
                        'exclude': ('*.pdf', '*.svg'),
                        'max_size': (75, 75),
                    },
                    'previews': {
                        'include': 'documents/*.pdf',
                        'max_size': (300, 500),
                        'output_types': ('webp', 'png'),
                    },
                    'previews2x': {
                        'include': 'documents/*.pdf',
                        'max_size': (600, 1000),
                        'output_types': ('webp', 'png'),
                    },
                },

                'site_url': 'https://localhost',
                'wikilinks_base_url': '/glossary',
                'html_url_extension': '',
                'jinja_filters': {
                    'number': to_number,
                    'num': to_number,
                    'currency': to_currency,
                    'cur': to_currency,
                }
            }
        ),
    ],
    'logging': {
        'datefmt': '%H:%M:%S',
        'fmt': '%(asctime)s %(levelname)s [%(name)s:%(lineno)d] %(message)s',
        'level': logging.INFO,
    },
    'globals': {
        'now': datetime.now(),

        # ==============================================================================
        # HEALTH INSURANCE
        # ==============================================================================

        # Mindestbemessungsgrundlage (€/mth) - BEZUGSGRÖSSE_WEST / 90 * 30 - §240 Abs. 4 SGV IV
        "GKV_MIN_INCOME": 1131.67,

        # Jahresarbeitsentgeltgrenze or Versicherungspflichtgrenze - Above this income (€/y), you are freiwillig versichert
        "GKV_FREIWILLIG_VERSICHERT_MIN_INCOME": 66600,

        # Above this income (€/mth), your employer pays for health insurance - §20 SGB IV
        "GKV_AZUBI_MAX_FREE_INCOME": 325,

        # Besondere Versicherungspflichtgrenze - Above this income (€/y), you pay the Höchstbeitrag - SVBezGrV 2021 [BBGKVPV]
        "GKV_HÖCHSTBEITRAG_MIN_INCOME": 59850,

        # Maximum daily Krankengeld - GKV_HÖCHSTBEITRAG_MIN_INCOME * 0.7 / 360 - § 47 SGB V
        "GKV_KRANKENGELD_DAILY_LIMIT": 116.38,

        # Above this income (€/m), you can't have Familienversicherung - 1/7 of BEZUGSGRÖSSE_WEST - §10 SGB V
        "GKV_FAMILIENVERSICHERUNG_MAX_INCOME": 485,

        # Base contribution (%), including Krankengeld - § 241 SGB V
        "GKV_BASE_CONTRIBUTION": 14.6,

        # Base contribution (%), excluding Krankengeld - § 243 SGB V
        "GKV_SELF_EMPLOYED_BASE_CONTRIBUTION": 14,

        # Average Zusatzbeitrag (%)
        "GKV_AVERAGE_ZUSATZBEITRAG": 1.6,

        # Estimated minimum contribution (€/mth) without employer contribution
        "GKV_ESTIMATED_MIN_CONTRIBUTION": 210,

        # Estimated maximum contribution for employees (€/mth)
        "GKV_ESTIMATED_EMPLOYEE_MAX_CONTRIBUTION": 470,

        # Estimated maximum contribution for freelancers (€/mth)
        "GKV_ESTIMATED_SELF_EMPLOYED_MAX_CONTRIBUTION": 925,

        # Estimated contribution for students (€/mth)
        "GKV_ESTIMATED_STUDENT_CONTRIBUTION": 120,

        # Used to calculate health insurance for a midijob - § 20 SGB IV - monitored
        "GKV_FACTOR_F": 0.6922,

        # Pflegeversicherung (%)
        "PFLEGEVERSICHERUNG_WITH_SURCHARGE": 3.4,
        "PFLEGEVERSICHERUNG_NO_SURCHARGE": 3.05,

        # BAFöG Bedarfssatz (€/y) - sum of §13 BAföG Abs 1.2 + 2.2
        "GKV_BAFOG_BEDARFSSATZ": 812,

        # Minimum income (€/y) to join the Künstlersozialkasse - § 3 KSVG
        "KSK_MIN_INCOME": 3900,

        # ==============================================================================
        # IMMIGRATION
        # ==============================================================================

        # Minimum income (€/y) to get a Blue Card
        # 2/3 * BEITRAGSBEMESSUNGSGRENZE_WEST - §18b AufenthG
        "BLUE_CARD_MIN_INCOME": 58400,

        # Minimum income (€/y) to get a Blue Card in shortage fields
        # 0.52 * BEITRAGSBEMESSUNGSGRENZE_WEST - §18b AufenthG
        "BLUE_CARD_SHORTAGE_MIN_INCOME": 45552,

        # Visa fees (€)
        "SCHENGEN_VISA_FEE": 75,
        "NATIONAL_VISA_FEE": 100,
        "NATIONAL_VISA_RENEWAL_FEE": 96,

        # Minimum pension value (€) to get a freelance visa above age 45
        "FREELANCE_VISA_MIN_PENSION": 206293,

        # Minimum guaranteed pension payment (€/m) to get a freelance visa above age 45
        "FREELANCE_VISA_MIN_MONTHLY_PENSION": 1432.59,

        # Minimum income (€/mth) before health insurance and rent to get a freelance visa
        "FREELANCE_VISA_MIN_INCOME": 449,

        # Minimum monthly pension (€/m) to get a work visa above age 45 - service.berlin.de/dienstleistung/305304
        "WORK_VISA_MIN_MONTHLY_PENSION": 4015,

        # Nationalities that can apply for a residence permit directly in Germany - §41 AufenthV
        "AUFENTHV_41_COUNTRIES": "Australia, Canada, Israel, Japan, New Zealand, South Korea, the United Kingdom or the United States",

        # ==============================================================================
        # TAXES
        # ==============================================================================

        # German minimum wage (€/h)
        "MINIMUM_WAGE": minimum_wage,

        # Minimum allowance for au pairs (€/mth)
        "AU_PAIR_MIN_ALLOWANCE": 280,

        # Below this income (€/mth), you have a minijob - § 8 SGB IV
        "MINIJOB_MAX_INCOME": round(minimum_wage * 130 / 3),

        # Below this income (€/mth), you have a midijob - §20 SGB IV
        "MIDIJOB_MAX_INCOME": 2000,

        # Median income (€/m) of all people who pay social contribs - SGB VI Anlage 1
        "BEZUGSGRÖSSE_WEST": 3395,

        # Median income (€/y) - rounded
        "MEDIAN_INCOME_BERLIN": 41800,
        "MEDIAN_INCOME_GERMANY": 41125,

        # Public pension contribution (%) - RVBeitrSBek 202X
        "RENTENVERSICHERUNG_EMPLOYEE_CONTRIBUTION": 9.3,
        "RENTENVERSICHERUNG_TOTAL_CONTRIBUTION": 18.6,

        # Minimum Vorsorgepauschale - §39b Abs. 3 EStG
        "VORSORGEPAUSCHAL_MIN": 1900,
        "VORSORGEPAUSCHAL_MIN_TAX_CLASS_3": 3000,

        # Grundfreibetrag (€/y) - § 32a EstG [GFB]
        "GRUNDFREIBETRAG": 10908,

        # Upper bound (€/y) of income tax tarif zones 2, 3 and 4 - § 32a EstG
        "INCOME_TAX_TARIF_2_MAX_INCOME": 15999,
        "INCOME_TAX_TARIF_3_MAX_INCOME": 62809,
        "INCOME_TAX_TARIF_4_MAX_INCOME": 277825,

        # Upper bound (€/y) of income tax tarif zones for tax classes 5 and 6 - § 39b Abs. 2 Satz 7 EstG [W1STKL5][W2STKL5][W3STKL5]
        "INCOME_TAX_CLASS_56_LIMIT_1": 12485,
        "INCOME_TAX_CLASS_56_LIMIT_2": 31404,
        "INCOME_TAX_CLASS_56_LIMIT_3": 222260,

        # Maximum income tax rate - § 32b EstG
        "INCOME_TAX_MAX_RATE": 45,

        # Church tax rate as percentage of income tax
        "CHURCH_TAX_RATE": 9,
        "CHURCH_TAX_RATE_BW_BY": 8,

        # Above that income tax amount, you pay a 11.9% solidarity tax (€/y) - §3 SolzG 4a [SOLZFREI]
        "SOLIDARITY_TAX_MILDERUNGSZONE_MIN_INCOME_TAX": 17543,

        # (€/y) - §9a EStG
        "ARBEITNEHMERPAUSCHALE": 1230,

        # The employee's contribution (%) for Arbeitslosenversicherung - § 341 SGB 3, BeiSaV 2019 - monitored
        "ARBEITSLOSENVERSICHERUNG_EMPLOYEE_RATE": 1.3,

        # Maximum income used to calculate pension contributions (€/y) [BBGRV] - § SGB 6, Anlage 2 - monitored
        "BEITRAGSBEMESSUNGSGRENZE_EAST": 85200,
        "BEITRAGSBEMESSUNGSGRENZE_WEST": 87600,

        # Maximum income from employment to stay a member of the KSK (€/y) - BEITRAGSBEMESSUNGSGRENZE_WEST / 2 - § 4 KSVG
        "KSK_MAX_EMPLOYMENT_INCOME": 43800,

        # (€/y) §10c EStG [SAP]
        "SONDERAUSGABEN_PAUSCHBETRAG": 36,

        # Kindergeld amount per child (€/m) - §6 BKGG
        "KINDERGELD": 250,

        # Tax break for parents (€/y) - § 32 EStG [KFB] - monitored
        "KINDERFREIBETRAG": 8952,

        # Tax break for single parents (€/y) - § 24b EStG [EFA]
        "ENTLASTUNGSBETRAG_ALLEINERZIEHENDE": 4260,
        "ENTLASTUNGSBETRAG_ALLEINERZIEHENDE_EXTRA_CHILD": 240,

        # Below that amount (€/y), you don't pay Gewerbesteuer - § 11 GewStG
        # WARNING: If you change this, some example calculations in the content will be incorrect
        "GEWERBESTEUER_FREIBETRAG": 24500,

        # Above that amount (€/y), you are no longer a Kleinunternehmer - § 19 UStG
        "KLEINUNTERNEHMER_MAX_INCOME_FIRST_YEAR": 22000,
        "KLEINUNTERNEHMER_MAX_INCOME": 50000,

        # Above that amount (€/y), you must use double entry bookkeeping - § 241a HGB
        "DOUBLE_ENTRY_MIN_REVENUE": 600000,
        "DOUBLE_ENTRY_MIN_INCOME": 60000,

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

        # ==============================================================================
        # PUBLIC TRANSIT
        # ==============================================================================

        # € - monitored
        "BVG_ABC_TICKET": 3.80,
        "BVG_FINE": 60,
        "BVG_REDUCED_FINE": 7,

        # ==============================================================================
        # ADMINISTRATION
        # ==============================================================================

        # € - hunderegister.berlin.de
        "HUNDEREGISTER_FEE": 17.50,

        # Dog tax (€/y) - §4 HuStG BE - monitored
        "HUNDESTEUER_FIRST_DOG": 120,
        "HUNDESTEUER_MORE_DOGS": 180,

        # Fee for registering dangerous breeds - service.berlin.de/dienstleistung/326263
        "ORDNUNGSAMT_DANGEROUS_DOG_FEE": 30,

        # (€) - service.berlin.de/dienstleistung/121822
        "HUNDEFUHRERSCHEIN_FEE": 94,

        # (€) - service.berlin.de/dienstleistung/121627
        "DRIVING_LICENCE_FEE": 49.80,
    },
}
