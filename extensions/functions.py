import re


def remove_accents(string: str):
    substitutions = (
        (r'[àáâãäå]', 'a'),
        (r'[èéêë]', 'e'),
        (r'[ìíîï]', 'i'),
        (r'[òóôõö]', 'o'),
        (r'[ùúûü]', 'u'),
    )
    for substitution in substitutions:
        string = re.sub(*substitution, string, flags=re.IGNORECASE)
    return string.upper()


def glossary_sorter(entry: dict):
    return remove_accents(entry['german_term'])


def glossary_groups(entries):
    entry_groups = {}
    for entry in entries:
        group_name = re.sub(r'[^a-z]', '#', remove_accents(entry['german_term']), flags=re.IGNORECASE)[0]
        entry_groups.setdefault(group_name, [])
        entry_groups[group_name].append(entry)

    for group_name in entry_groups:
        entry_groups[group_name].sort(key=glossary_sorter)

    return entry_groups
