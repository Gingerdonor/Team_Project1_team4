# backend/logic.py

# 천간/지지 인덱스
SKY_MAP = {
    "갑": 1,
    "을": 2,
    "병": 3,
    "정": 4,
    "무": 5,
    "기": 6,
    "경": 7,
    "신": 8,
    "임": 9,
    "계": 10,
}
EARTH_MAP = {
    "자": 1,
    "축": 2,
    "인": 3,
    "묘": 4,
    "진": 5,
    "사": 6,
    "오": 7,
    "미": 8,
    "신": 9,
    "유": 10,
    "술": 11,
    "해": 12,
}

# 오행/음양 매핑
SKY_ELEMENT = {
    1: "wood",
    2: "wood",
    3: "fire",
    4: "fire",
    5: "earth",
    6: "earth",
    7: "metal",
    8: "metal",
    9: "water",
    10: "water",
}
SKY_YINYANG = {
    1: "yang",
    2: "yin",
    3: "yang",
    4: "yin",
    5: "yang",
    6: "yin",
    7: "yang",
    8: "yin",
    9: "yang",
    10: "yin",
}
EARTH_ELEMENT = {
    1: "water",
    2: "earth",
    3: "wood",
    4: "wood",
    5: "earth",
    6: "fire",
    7: "fire",
    8: "earth",
    9: "metal",
    10: "metal",
    11: "earth",
    12: "water",
}
EARTH_YINYANG = {
    1: "yang",
    2: "yin",
    3: "yang",
    4: "yin",
    5: "yang",
    6: "yin",
    7: "yang",
    8: "yin",
    9: "yang",
    10: "yin",
    11: "yang",
    12: "yin",
}

ELEMENT_LIST = ["wood", "fire", "earth", "metal", "water"]
ELEMENT_KO = {
    "wood": ("목(木)", "성장·확장, 기획, 시작 에너지"),
    "fire": ("화(火)", "열정, 표현, 추진력"),
    "earth": ("토(土)", "안정, 현실감, 구조 잡기"),
    "metal": ("금(金)", "분석, 결단, 규칙과 원칙"),
    "water": ("수(水)", "감정, 직관, 흐름, 공감"),
}


def parse_ganji_to_index(ganji_str: str):
    if not ganji_str:
        return [0, 0]
    korean_part = ganji_str.split("(")[0]
    if len(korean_part) < 2:
        return [0, 0]
    gan = SKY_MAP.get(korean_part[0], 0)
    ji = EARTH_MAP.get(korean_part[1], 0)
    return [gan, ji]


def saju_to_profile(saju, sky_weight=1.2, earth_weight=1.0):
    elem_scores = {e: 0.0 for e in ELEMENT_LIST}
    yin = 0.0
    yang = 0.0

    sky_indices = [saju[0], saju[2], saju[4]]
    earth_indices = [saju[1], saju[3], saju[5]]

    for idx in sky_indices:
        element = SKY_ELEMENT.get(idx)
        yy = SKY_YINYANG.get(idx)
        if element:
            elem_scores[element] += sky_weight
        if yy == "yang":
            yang += 1.0
        elif yy == "yin":
            yin += 1.0

    for idx in earth_indices:
        element = EARTH_ELEMENT.get(idx)
        yy = EARTH_YINYANG.get(idx)
        if element:
            elem_scores[element] += earth_weight
        if yy == "yang":
            yang += 1.0
        elif yy == "yin":
            yin += 1.0

    return {"elements": elem_scores, "yin": yin, "yang": yang}


# birth_weight를 0.4로 상향 조정 (생일 영향력 확대... 0.1로 설정하면 생일이 바뀌어도 동일한 결과가 나옴)
def combine_profiles(birth_profile, today_profile, birth_weight=0.4):
    w_birth = birth_weight
    w_today = 1.0 - birth_weight
    elements = {}
    for e in ELEMENT_LIST:
        elements[e] = (
            birth_profile["elements"].get(e, 0.0) * w_birth
            + today_profile["elements"].get(e, 0.0) * w_today
        )

    yin = birth_profile["yin"] * w_birth + today_profile["yin"] * w_today
    yang = birth_profile["yang"] * w_birth + today_profile["yang"] * w_today
    return {"elements": elements, "yin": yin, "yang": yang}


def profile_to_axes(profile):
    e = profile["elements"]
    yin = profile["yin"]
    yang = profile["yang"]

    return {
        "EI": {
            "E": yang + e["fire"] + e["metal"] * 0.5,
            "I": yin + e["water"] + e["wood"] * 0.5,
        },
        "SN": {
            "S": e["earth"] + e["metal"] * 0.7 + yin * 0.3,
            "N": e["wood"] + e["fire"] * 0.7 + yang * 0.3,
        },
        "TF": {
            "T": e["metal"] + yang * 0.5,
            "F": e["water"] + e["wood"] * 0.5 + yin * 0.3,
        },
        "PJ": {
            "P": e["fire"] + e["water"] * 0.5 + e["wood"] * 0.3,
            "J": e["earth"] + e["metal"] * 0.5,
        },
    }


def apply_daily_rotation(axes, today_saju, strength=0.7):
    day_sky = today_saju[4]
    day_earth = today_saju[5]

    flags = {
        "EI": ((day_sky + day_earth) % 2, ("E", "I")),
        "SN": ((day_sky * day_earth) % 2, ("S", "N")),
        "TF": ((day_sky + 2 * day_earth) % 2, ("T", "F")),
        "PJ": ((2 * day_sky + day_earth) % 2, ("P", "J")),
    }

    new_axes = {k: v.copy() for k, v in axes.items()}
    for axis, (flag, (a1, a2)) in flags.items():
        avg = (new_axes[axis][a1] + new_axes[axis][a2]) / 2.0
        boost = avg * strength
        if flag == 0:
            new_axes[axis][a1] += boost
        else:
            new_axes[axis][a2] += boost
    return new_axes


def axes_to_mbti(axes):
    res = ""
    res += "E" if axes["EI"]["E"] >= axes["EI"]["I"] else "I"
    res += "S" if axes["SN"]["S"] >= axes["SN"]["N"] else "N"
    res += "T" if axes["TF"]["T"] >= axes["TF"]["F"] else "F"
    res += "P" if axes["PJ"]["P"] >= axes["PJ"]["J"] else "J"
    return res


def get_destiny_partner(axes):
    def pick(pair, k1, k2):
        v1, v2 = pair[k1], pair[k2]
        ratio = max(v1, v2) / max(min(v1, v2), 0.001)
        if ratio > 1.1:
            return k2 if v1 > v2 else k1
        return k1 if v1 > v2 else k2

    return (
        pick(axes["EI"], "E", "I")
        + pick(axes["SN"], "S", "N")
        + pick(axes["TF"], "T", "F")
        + pick(axes["PJ"], "P", "J")
    )


# 상세한 문장 생성 함수
def generate_explanation(combined, axes, my_mbti, partner_mbti, today_saju):
    elems = combined["elements"]
    top_elem = max(elems, key=elems.get)
    top_elem_ko = ELEMENT_KO[top_elem]

    yin = combined["yin"]
    yang = combined["yang"]

    lines_persona = []
    lines_destiny = []

    # [Persona] 헤더 및 요약
    lines_persona.append("▶ 오늘의 사주 에너지 요약")
    lines_persona.append(
        f" - 오늘은 특히 '{top_elem_ko[0]}'({top_elem_ko[1]}) 기운이 강하게 잡힙니다."
    )
    lines_persona.append(
        " - 양(陽) %.1f / 음(陰) %.1f 비율로, 전체적으로 %s 쪽에 조금 더 무게가 실려 있습니다."
        % (yang, yin, "양(외향·표현)" if yang >= yin else "음(내면·정리)")
    )
    lines_persona.append(
        " - 오늘 일간/일지(일진)의 흐름까지 반영하여, 평소 성향 위에 '오늘만의 색깔'을 더해 MBTI를 조합했습니다."
    )
    lines_persona.append("")

    # [Persona] 상세 설명
    E, I = axes["EI"]["E"], axes["EI"]["I"]
    S, N = axes["SN"]["S"], axes["SN"]["N"]
    T, F = axes["TF"]["T"], axes["TF"]["F"]
    P, J = axes["PJ"]["P"], axes["PJ"]["J"]

    # (1) EI
    if my_mbti[0] == "E":
        lines_persona.append(
            " - E(외향): 양(陽)·화(火)·금(金) 에너지에 더해, 오늘 일진의 흐름이 '밖으로 드러내는 쪽'을 한 번 더 밀어줘 "
            "사람과 부딪히고 표현하는 태도가 잘 맞습니다. [E %.2f / I %.2f]" % (E, I)
        )
    else:
        lines_persona.append(
            " - I(내향): 음(陰)·수(水)·목(木) 에너지에 오늘 일진이 더해져, "
            "혼자 정리하고 깊게 몰입하는 쪽으로 에너지가 모입니다. [E %.2f / I %.2f]"
            % (E, I)
        )

    # (2) SN
    if my_mbti[1] == "S":
        lines_persona.append(
            " - S(감각): 토(土)·금(金) 기운과 오늘 일진이 '현실·디테일' 쪽을 강조해, "
            "지금 눈앞의 일과 구체적인 정보에 집중할수록 잘 풀리는 날입니다. [S %.2f / N %.2f]"
            % (S, N)
        )
    else:
        lines_persona.append(
            " - N(직관): 목(木)·화(火) 에너지 위로 오늘 일진이 아이디어·확장성을 키워줘, "
            "가능성과 그림을 크게 그려보는 태도가 유리합니다. [S %.2f / N %.2f]"
            % (S, N)
        )

    # (3) TF
    if my_mbti[2] == "T":
        lines_persona.append(
            " - T(사고): 금(金)과 양(陽) 기운에 오늘 일진이 더해져, "
            "감정보다는 '논리·효율·결과' 기준으로 결정을 내리기 좋은 날입니다. [T %.2f / F %.2f]"
            % (T, F)
        )
    else:
        lines_persona.append(
            " - F(감정): 수(水)·목(木)·음(陰) 에너지에 오늘 일진이 보탬이 되어, "
            "사람의 마음·관계·분위기를 읽고 움직일수록 운의 흐름을 부드럽게 탈 수 있습니다. [T %.2f / F %.2f]"
            % (T, F)
        )

    # (4) PJ
    if my_mbti[3] == "J":
        lines_persona.append(
            " - J(판단): 토(土)·금(金) 비중과 오늘 일진이 '정리·마무리' 성향을 강화해, "
            "계획을 세우고 스케줄을 잡고 일을 끝까지 밀어붙이기 좋은 날입니다. [P %.2f / J %.2f]"
            % (P, J)
        )
    else:
        lines_persona.append(
            " - P(인식): 화(火)·수(水)·목(木) 에너지 위로 오늘 일진이 유연함을 더해, "
            "일단 열어두고 흘러가며 기회를 보는 태도가 잘 맞습니다. [P %.2f / J %.2f]"
            % (P, J)
        )

    # [Destiny] 상세 설명
    lines_destiny.append("▶ 오늘 나에게 잘 맞는 운명의 사람 MBTI 해석")
    lines_destiny.append(" - 오늘 나의 태도 MBTI    : %s" % my_mbti)
    lines_destiny.append(" - 오늘 잘 맞는 상대 MBTI : %s" % partner_mbti)
    lines_destiny.append(
        " - 오늘의 오행/음양 에너지와 일진 기준으로 내가 많이 쏠린 축은 '보완형(반대 성향)',"
    )
    lines_destiny.append(
        "   비교적 균형인 축은 '동질형(비슷한 성향)'을 추천해서 만든 조합입니다."
    )
    lines_destiny.append(
        " - 그래서 매일 일진이 바뀔 때마다, 나와 가장 잘 맞는 상대의 MBTI 조합도 함께 달라집니다."
    )

    # 상대 추천 근거 및 수치 생성
    # 로직: 나의 쏠림이 심하면(ratio > 1.1) -> 반대 성향(보완) 추천 -> 수치는 반대로 뒤집어서 표현
    #       나의 쏠림이 덜하면(ratio <= 1.1) -> 같은 성향(동질) 추천 -> 수치는 내 것 그대로 표현
    axis_info = [
        ("EI", "E", "I"),
        ("SN", "S", "N"),
        ("TF", "T", "F"),
        ("PJ", "P", "J"),
    ]

    for axis_key, k1, k2 in axis_info:
        v1 = axes[axis_key][k1]
        v2 = axes[axis_key][k2]
        ratio = max(v1, v2) / max(min(v1, v2), 0.001)

        if ratio > 1.1:
            # 보완 관계 (수치 스왑)
            p_v1, p_v2 = v2, v1
            relation = "보완"
            desc = (
                # "서로 반대되는 에너지가 강해, 나에게 부족한 부분을 채워줄 수 있습니다."
            )
        else:
            # 동질 관계 (수치 유지)
            p_v1, p_v2 = v1, v2
            relation = "동질"
            desc = (
                # "에너지 흐름이 비슷해, 편안하게 공감하고 소통할 수 있습니다."
            )

        lines_destiny.append(f"[{k1} {p_v1:.2f} / {k2} {p_v2:.2f}]")

    return "\n".join(lines_persona), "\n".join(lines_destiny)
