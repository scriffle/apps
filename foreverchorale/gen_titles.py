#!/usr/bin/env python3
"""
gen_titles.py — produce titles.json: English + Chinese translations for every
unique German chorale title, keyed by the EXACT German string as it appears in
manifest.json (so OCR variants like "seih"/"sieh", "delig"/"selig" each resolve).

EN / ZH are faithful renderings of the German hymn incipits; where a standard
English hymn title exists (Wachet auf, O Haupt voll Blut, Ein feste Burg, ...)
that wording is preferred. Chinese is Simplified, using common liturgical
vocabulary (主 Lord, 上帝 God, 耶稣 Jesus, 基督 Christ, 圣灵 Holy Spirit).

The two arrays are aligned to sorted(set(titles)); the script asserts the
counts match and every entry is filled before writing.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(HERE, "manifest.json"), encoding="utf-8") as f:
    manifest = json.load(f)
titles = sorted({c["title"] for c in manifest["chorales"]})

EN = [
    "Ah God and Lord",                                              # 1
    "Ah God, hear my sighing",                                      # 2
    "Ah God, look down from heaven",                               # 3
    "Ah God, look down from heaven",                               # 4
    "Ah God, how much heartache",                                  # 5
    "Ah, abide with us, Lord Jesus Christ",                        # 6
    "Ah dear Christians, be comforted",                            # 7
    "Ah how fleeting, ah how futile",                              # 8
    "Ah, what shall I, a sinner, do?",                            # 9
    "All mankind must die",                                        # 10
    "To God alone on high be glory",                              # 11
    "In thee alone, Lord Jesus Christ",                          # 12
    "All depends on God's blessing",                              # 13
    "When Jesus Christ, in the night he was betrayed",            # 14
    "When the gracious God",                                       # 15
    "When, forty days after Easter",                              # 16
    "By the waters of Babylon",                                   # 17
    "In my dear God I trust",                                      # 18
    "Up, up, my heart, and all my mind",                         # 19
    "From the depths of my heart",                                # 20
    "From deep affliction I cry to thee",                        # 21
    "Commit thy ways to him",                                     # 22
    "Christ is risen",                                            # 23
    "Christ lay in the bonds of death",                          # 24
    "Christ, who art the bright day",                            # 25
    "Christ our Lord came to the Jordan",                        # 26
    "Christ, who art day and light",                             # 27
    "Christ, helper of thy cross-bearing church",                # 28
    "We should now praise Christ",                               # 29
    "Christ is risen, he has overcome",                          # 30
    "Christ, who is my life",                                    # 31
    "Christ, who makes us blessed",                              # 32
    "Christ, who makes us blessed",                              # 33
    "When the Lord Christ sat at table",                        # 34
    "Thanks be to God on high",                                  # 35
    "O thank the Lord, for he is very kind",                    # 36
    "The old year now has passed away",                         # 37
    "The newborn little child",                                  # 38
    "May God the Father and God the Son ordain it",             # 39
    "May my God ordain it",                                      # 40
    "The Father up on high",                                     # 41
    "The Lord is my faithful shepherd",                         # 42
    "The day so rich in joy",                                    # 43
    "Thou who art three in unity",                               # 44
    "The Holy Spirit's abundant grace",                         # 45
    "The night has come",                                        # 46
    "The sun with all its radiance has set",                    # 47
    "These are the holy Ten Commandments",                      # 48
    "To thee, to thee, Jehovah, will I sing",                   # 49
    "Thou Prince of Peace, Lord Jesus Christ",                  # 50
    "Thou Prince of Life, Lord Jesus Christ",                   # 51
    "Thou great Man of Sorrows",                                 # 52
    "Thou Prince of Life, Lord Jesus Christ",                   # 53
    "Thou fair edifice of the world",                           # 54
    "Through Adam's fall all is corrupted",                     # 55
    "A little lamb goes forth and bears the guilt",             # 56
    "A mighty fortress is our God",                             # 57
    "One thing is needful, ah Lord, this one",                  # 58
    "Have mercy on me, O Lord God",                             # 59
    "Keep us, Lord, steadfast in thy word",                     # 60
    "Rouse thyself, my feeble spirit",                          # 61
    "The glorious day has dawned",                              # 62
    "The holy Christ is risen",                                 # 63
    "Salvation has come to us",                                 # 64
    "It is enough! so take, Lord, my spirit",                  # 65
    "It is surely the appointed time",                         # 66
    "The fool's own mouth declares there is no God",           # 67
    "Before God's throne they stand",                          # 68
    "The last day will soon be here",                          # 69
    "May God be gracious unto us",                             # 70
    "Rejoice greatly, O my soul",                              # 71
    "Rejoice, all ye Christians",                              # 72
    "For joy let us leap and dance",                          # 73
    "Before thy throne I now appear",                         # 74
    "All praise to thee, Jesus Christ",                       # 75
    "Be content and be still",                                # 76
    "God the Father, be our stay",                            # 77
    "God of heaven and of earth",                             # 78
    "God has given the Gospel",                               # 79
    "God still lives",                                        # 80
    "May God be praised and blessed",                         # 81
    "May God be gracious and merciful to us",                # 82
    "God, who thyself art the light",                         # 83
    "The Son of God is come",                                 # 84
    "Thank God, it now draws to its end",                     # 85
    "Hast thou then, Jesus, hidden thy face",                 # 86
    "Holy, holy",                                             # 87
    "Help me to praise God's goodness",                       # 88
    "Lord Christ, the only Son of God",                       # 89
    "Lord Christ, the only Son of God",                       # 90
    "Lord God, we all praise thee",                           # 91
    "Lord God, we praise thee",                               # 92
    "Lord Jesus Christ, turn thou to us",                     # 93
    "Lord Jesus Christ, thou hast prepared",                  # 94
    "Lord Jesus Christ, thou highest good",                   # 95
    "Lord Jesus Christ, I cry to thee",                       # 96
    "Lord Jesus Christ, light of my life",                    # 97
    "Lord Jesus Christ, true man and God",                    # 98
    "Lord, as thou wilt, so deal with me",                    # 99
    "Lord, I call to mind that time",                         # 100
    "Lord, I have done wrong",                                # 101
    "Lord, now let thy servant depart in peace",             # 102
    "Lord, rebuke me not in thy wrath",                       # 103
    "Lord, as thou wilt, so deal with me",                    # 104
    "With all my heart I love thee, O Lord",                  # 105
    "My heart is filled with longing",                        # 106
    "O dearest Jesus, what law hast thou broken",             # 107
    "O dearest Jesus, what law hast thou broken",             # 108
    "Today, O man, is a great day of mourning",               # 109
    "Today God's Son triumphs",                               # 110
    "Help, God, let me succeed",                              # 111
    "Help, Lord Jesus, let it prosper",                       # 112
    "I am indeed, Lord, in thy power",                        # 113
    "I thank thee already through thy Son",                   # 114
    "I thank thee, God, for all thy bounty",                  # 115
    "I thank thee, dear Lord",                                # 116
    "I thank thee, dear Lord",                                # 117
    "I thank thee, O God, upon thy throne",                   # 118
    "I rejoice in thee",                                      # 119
    "I have yielded to God's heart and will",                # 120
    "I have committed my cause to God",                       # 121
    "I call to thee, Lord Jesus Christ",                      # 122
    "Ye stars, ye lofty skies",                               # 123
    "In all my deeds",                                        # 124
    "In thee, Lord, have I put my trust",                     # 125
    "In sweet rejoicing",                                     # 126
    "If God is my shield and helper",                         # 127
    "Jesus' suffering, pain and death",                       # 128
    "Jesus, bliss of my soul",                                # 129
    "Jesus, joy of my heart",                                 # 130
    "Jesus, Jesus, thou art mine",                            # 131
    "Jesus, thy deep wounds",                                 # 132
    "Jesus, thou who hast redeemed my soul",                  # 133
    "Jesus, thou who thyself well knowest",                   # 134
    "Jesus, thou my dearest life",                            # 135
    "Jesus, my joy",                                          # 136
    "Jesus, joy of all my joys",                              # 137
    "Jesus, now be praised",                                  # 138
    "Jesus Christ, our Savior",                               # 139
    "Jesus, my sure confidence",                              # 140
    "God has forsaken no one",                                # 141
    "Come, God Creator, Holy Spirit",                         # 142
    "Come, Holy Spirit, Lord God",                            # 143
    "'Come unto me,' he says",                                # 144
    "'Come unto me,' says the Son of God",                    # 145
    "Kyrie! God the Father in eternity",                      # 146
    "Incline thine ear, O Lord",                              # 147
    "Dearest God, when shall I die",                          # 148
    "Dearest Jesus, we are here",                             # 149
    "Dearest Immanuel, Prince of the faithful",               # 150
    "Praise the Lord, for he is kind",                        # 151
    "Praise God, ye Christians, all together",                # 152
    "Deal with me, God, in thy goodness",                     # 153
    "My soul magnifies the Lord",                             # 154
    "I close my eyes now in sleep",                           # 155
    "My soul magnifies the Lord",                             # 156
    "I will not let my Jesus go (for Jesus...)",              # 157
    "I will not let my Jesus go, because...",                 # 158
    "My life's final hour",                                   # 159
    "In peace and joy I now depart",                          # 160
    "In peace and joy I now depart",                          # 161
    "In the midst of life we are in death",                   # 162
    "Not so sorrowful, not so much",                          # 163
    "Take from us, Lord, thou faithful God",                  # 164
    "Now we implore the Holy Spirit",                         # 165
    "Now thank we all our God",                               # 166
    "Now rejoice, all ye children of God",                    # 167
    "Dear Christians, one and all, rejoice",                  # 168
    "Now come, Savior of the nations",                        # 169
    "Now let us give thanks to God the Lord",                 # 170
    "Now all things lie beneath thee",                        # 171
    "Now praise the Lord, my soul",                           # 172
    "Now let all praise God's mercy",                         # 173
    "Now all the woods are at rest",                          # 174
    "Now that the day has reached its end",                   # 175
    "O eternity, thou word of thunder",                       # 176
    "O God, thou faithful God",                               # 177
    "O sacred head, now wounded",                             # 178
    "O Lord God, thy divine word",                            # 179
    "O anguish of heart, O dread",                            # 180
    "O Jesus, thou my bridegroom",                            # 181
    "O Lamb of God, most innocent",                           # 182
    "O man, bewail thy grievous sin",                         # 183
    "O man, behold Jesus Christ",                             # 184
    "O sorrow, O heartache",                                  # 185
    "O world, behold thy life upon the cross",                # 186
    "O great God of might",                                   # 187
    "O how blessed are ye, ye faithful",                      # 188
    "O how blessed are ye, ye faithful",                      # 189
    "O we poor sinners",                                      # 190
    "A boy is born in Bethlehem",                             # 191
    "Holy, holy, Lord God of hosts",                          # 192
    "Behold, ye sinners",                                     # 193
    "Deck thyself, my soul, with gladness",                   # 194
    "Soar aloft to thy God",                                  # 195
    "Bridegroom of the soul",                                 # 196
    "All praise and thanks to God most high",                 # 197
    "Hail to thee, O gracious Jesus",                         # 198
    "Let us sing from the bottom of our hearts",              # 199
    "Sing to the Lord a new song",                            # 200
    "So now, my Jesus, thou bidst good night",                # 201
    "Should I not sing to my God",                            # 202
    "Rebuke me not in thy wrath",                             # 203
    "Unto us a little child is born today",                   # 204
    "Farewell I gladly bid thee",                             # 205
    "Our Father in the kingdom of heaven",                    # 206
    "Graciously grant us peace",                              # 207
    "From heaven on high I come to you",                      # 208
    "From God I will not turn away",                          # 209
    "Awake, my heart",                                        # 210
    "Wake, awake, for night is flying",                       # 211
    "Why art thou troubled, my heart",                        # 212
    "Why then should I grieve",                               # 213
    "What God ordains is always good",                        # 214
    "Why art thou troubled, my heart",                        # 215
    "Why art thou so troubled, O my soul",                    # 216
    "What care I for the world",                              # 217
    "What my God wills be ever done",                         # 218
    "What my God wills be ever done",                         # 219
    "Why wilt thou fret, O my soul",                          # 220
    "Away, my heart, with such thoughts",                     # 221
    "Worldly honor and earthly goods",                        # 222
    "When I am in fear and distress",                         # 223
    "When my final hour is at hand",                          # 224
    "When in the hour of utmost need",                        # 225
    "Who trusts in God has built full well",                  # 226
    "He who dwells in the shelter of the Most High",          # 227
    "If thou but suffer God to guide thee",                   # 228
    "If thou but suffer God to guide thee",                   # 229
    "Who knows how near my end may be",                       # 230
    "Rouse thyself, my soul",                                 # 231
    "How sorely troubled art thou within me, O soul",         # 232
    "How brightly shines the morning star",                   # 233
    "We Christian folk",                                      # 234
    "We all believe in one true God",                         # 235
    "Unless God grants his favor to the house",               # 236
    "If God the Lord be not on our side",                     # 237
    "Whither shall I flee",                                   # 238
    "If God were not with us at this time",                   # 239
    "Enter in at thy gates",                                  # 240
]

ZH = [
    "啊，上帝与主",                                  # 1
    "上帝啊，求你垂听我的叹息",                      # 2
    "上帝啊，求你从天垂顾",                          # 3
    "上帝啊，求你从天垂顾",                          # 4
    "上帝啊，多少伤痛愁苦",                          # 5
    "主耶稣基督，求你与我们同在",                    # 6
    "亲爱的基督徒啊，要得安慰",                      # 7
    "何其短暂，何其虚空",                            # 8
    "啊，我这罪人当如何是好？",                      # 9
    "世人都必死亡",                                  # 10
    "唯独至高上帝得荣耀",                            # 11
    "主耶稣基督，我唯独仰望你",                      # 12
    "万事全凭上帝赐福",                              # 13
    "当耶稣基督在被卖的那一夜",                      # 14
    "当那慈爱的上帝",                                # 15
    "复活节后第四十日",                              # 16
    "在巴比伦河边",                                  # 17
    "我信靠我亲爱的上帝",                            # 18
    "起来，我心，并我全人",                          # 19
    "从我心灵深处",                                  # 20
    "我从深渊向你呼求",                              # 21
    "将你的道路交托于他",                            # 22
    "基督已复活",                                    # 23
    "基督身陷死亡的捆锁",                            # 24
    "基督，你是明亮的白昼",                          # 25
    "基督我主来到约旦河",                            # 26
    "基督，你是白昼与光明",                          # 27
    "基督，背负十架教会的扶助者",                    # 28
    "我们当颂赞基督",                                # 29
    "基督已复活，已然得胜",                          # 30
    "基督是我的生命",                                # 31
    "基督使我们得福",                                # 32
    "基督使我们得福",                                # 33
    "当主基督坐席之时",                              # 34
    "愿至高之处的上帝得感谢",                        # 35
    "当称谢主，因他大施恩慈",                        # 36
    "旧岁已然消逝",                                  # 37
    "新生的小婴孩",                                  # 38
    "愿圣父圣子成就此事",                            # 39
    "愿我的上帝成就此事",                            # 40
    "在天上的父",                                    # 41
    "主是我信实的牧者",                              # 42
    "这充满欢欣的日子",                              # 43
    "你是三位一体的真神",                            # 44
    "圣灵丰盛的恩典",                                # 45
    "黑夜已经来临",                                  # 46
    "太阳带着光辉已西沉",                            # 47
    "这是神圣的十诫",                                # 48
    "耶和华啊，我要向你歌唱",                        # 49
    "和平之君，主耶稣基督",                          # 50
    "生命之君，主耶稣基督",                          # 51
    "你这大忧患之人",                                # 52
    "生命之君，主耶稣基督",                          # 53
    "你这华美的世界殿宇",                            # 54
    "因亚当堕落，全然败坏",                          # 55
    "羔羊前行，背负罪愆",                            # 56
    "上主是我坚固保障",                              # 57
    "不可少的只有一件，主啊",                        # 58
    "主上帝啊，求你怜悯我",                          # 59
    "主啊，求你使我们持守你的道",                    # 60
    "振作吧，我软弱的心灵",                          # 61
    "荣耀之日已经显现",                              # 62
    "圣洁的基督已复活",                              # 63
    "救恩已临到我们",                                # 64
    "够了！主啊，求你接纳我的灵魂",                  # 65
    "那日子确已临近",                                # 66
    "愚顽人心里说没有神",                            # 67
    "在上帝宝座前站立",                              # 68
    "末日即将来临",                                  # 69
    "愿上帝施恩与我们",                              # 70
    "我的灵啊，要大大欢欣",                          # 71
    "众基督徒啊，当欢喜快乐",                        # 72
    "让我们因喜乐踊跃",                              # 73
    "我今来到你的宝座前",                            # 74
    "愿你得颂赞，耶稣基督",                          # 75
    "当知足，当安静",                                # 76
    "父上帝啊，与我们同住",                          # 77
    "天地的主宰上帝",                                # 78
    "上帝赐下了福音",                                # 79
    "上帝仍然活着",                                  # 80
    "愿上帝被颂赞、被称颂",                          # 81
    "愿上帝怜恤、施恩与我们",                        # 82
    "上帝啊，你本身就是光",                          # 83
    "上帝的儿子已经降临",                            # 84
    "感谢上帝，如今将近终了",                        # 85
    "耶稣啊，你竟向我掩面吗",                        # 86
    "圣哉，圣哉",                                    # 87
    "助我颂赞上帝的良善",                            # 88
    "主基督，上帝的独生子",                          # 89
    "主基督，上帝的独生子",                          # 90
    "主上帝，我们都颂赞你",                          # 91
    "主上帝，我们颂赞你",                            # 92
    "主耶稣基督，求你转向我们",                      # 93
    "主耶稣基督，你已预备",                          # 94
    "主耶稣基督，至高的善",                          # 95
    "主耶稣基督，我向你呼求",                        # 96
    "主耶稣基督，我生命的光",                        # 97
    "主耶稣基督，真人真神",                          # 98
    "主啊，照你的旨意待我",                          # 99
    "主啊，我追念那段时光",                          # 100
    "主啊，我行了恶事",                              # 101
    "主啊，如今照你的话让仆人安然离世",              # 102
    "主啊，求你不要在烈怒中责罚我",                  # 103
    "主啊，照你的旨意待我",                          # 104
    "主啊，我衷心爱你",                              # 105
    "我心切切渴慕",                                  # 106
    "至爱的耶稣，你究竟犯了何罪",                    # 107
    "至爱的耶稣，你究竟犯了何罪",                    # 108
    "人哪，今日是大哀悼之日",                        # 109
    "今日上帝之子得胜",                              # 110
    "上帝啊，求你助我成事",                          # 111
    "主耶稣啊，求你使这事成就",                      # 112
    "主啊，我确在你的手中",                          # 113
    "我藉你的儿子向你献上感谢",                      # 114
    "上帝啊，我为你一切恩惠感谢你",                  # 115
    "亲爱的主，我感谢你",                            # 116
    "亲爱的主，我感谢你",                            # 117
    "在宝座上的上帝啊，我感谢你",                    # 118
    "我因你而欢喜",                                  # 119
    "我已顺服上帝的心意",                            # 120
    "我已将我的事交托上帝",                          # 121
    "主耶稣基督，我向你呼求",                        # 122
    "众星啊，高天啊",                                # 123
    "在我一切作为中",                                # 124
    "主啊，我向来仰望你",                            # 125
    "在甜美的欢乐中",                                # 126
    "若上帝作我的盾牌与帮助",                        # 127
    "耶稣的受难、苦楚与死",                          # 128
    "耶稣，我心灵的喜乐",                            # 129
    "耶稣，我心的喜乐",                              # 130
    "耶稣，耶稣，你属我",                            # 131
    "耶稣，你深深的伤痕",                            # 132
    "耶稣，你救赎了我的灵魂",                        # 133
    "耶稣，你自己深知",                              # 134
    "耶稣，我最亲爱的生命",                          # 135
    "耶稣，我的喜乐",                                # 136
    "耶稣，我喜乐中的喜乐",                          # 137
    "耶稣，如今愿你受颂赞",                          # 138
    "耶稣基督，我们的救主",                          # 139
    "耶稣，我的确据",                                # 140
    "上帝未曾撇弃任何人",                            # 141
    "来吧，创造主上帝，圣灵",                        # 142
    "来吧，圣灵，主上帝",                            # 143
    "“到我这里来”，他说",                            # 144
    "“到我这里来”，上帝之子说",                      # 145
    "求主怜悯！永恒的父上帝",                        # 146
    "主啊，求你侧耳垂听",                            # 147
    "至爱的上帝，我几时离世",                        # 148
    "至爱的耶稣，我们在此聚集",                      # 149
    "至爱的以马内利，敬虔者之君",                    # 150
    "你们要赞美主，因他满有恩慈",                    # 151
    "众基督徒啊，齐来赞美上帝",                      # 152
    "上帝啊，求你照你的慈爱待我",                    # 153
    "我心尊主为大",                                  # 154
    "此刻我合上双眼",                                # 155
    "我心尊主为大",                                  # 156
    "我必不撇下我的耶稣（因耶稣…）",                # 157
    "我必不撇下我的耶稣，因为…",                    # 158
    "我此生的最后时光",                              # 159
    "我安然喜乐地离世",                              # 160
    "我安然喜乐地离世",                              # 161
    "我们身处生命之中，却被死亡环绕",                # 162
    "不要这样忧伤，不要如此",                        # 163
    "信实的上帝啊，求你除去我们的灾祸",              # 164
    "如今我们祈求圣灵",                              # 165
    "万民称谢上帝",                                  # 166
    "上帝的众儿女啊，当欢喜",                        # 167
    "亲爱的众基督徒啊，当欢喜",                      # 168
    "万民的救主，今请降临",                          # 169
    "来，让我们向主上帝献上感谢",                    # 170
    "万有今俯伏在你脚前",                            # 171
    "我的心哪，当称颂主",                            # 172
    "你们都要颂赞上帝的怜悯",                        # 173
    "万林如今安歇",                                  # 174
    "如今白昼已尽",                                  # 175
    "永恒啊，你这如雷之言",                          # 176
    "上帝啊，你信实的上帝",                          # 177
    "哦，满是血迹与伤痕的圣首",                      # 178
    "主上帝啊，你神圣的话语",                        # 179
    "哦，心中的忧惧与惊惶",                          # 180
    "耶稣啊，你是我的新郎",                          # 181
    "哦，无瑕的上帝羔羊",                            # 182
    "人哪，当痛悔你的大罪",                          # 183
    "人哪，当仰望耶稣基督",                          # 184
    "哦，悲伤，哦，心痛",                            # 185
    "世人哪，看哪你的生命悬于十架",                  # 186
    "哦，大能的上帝",                                # 187
    "敬虔的人哪，你们何等有福",                      # 188
    "敬虔的人哪，你们何等有福",                      # 189
    "哦，我们这些可怜的罪人",                        # 190
    "一婴孩生在伯利恒",                              # 191
    "圣哉，圣哉，万军之主上帝",                      # 192
    "罪人哪，你们要看",                              # 193
    "我心哪，当装饰自己迎接主",                      # 194
    "向你的上帝展翅高飞",                            # 195
    "灵魂的新郎",                                    # 196
    "愿至高的善得赞美与尊荣",                        # 197
    "仁慈的耶稣，向你致敬",                          # 198
    "我们从心底歌唱",                                # 199
    "当向主唱新歌",                                  # 200
    "我的耶稣，你如今道别",                          # 201
    "我岂可不向我的上帝歌唱",                        # 202
    "求你不要在烈怒中责罚我",                        # 203
    "今日有一婴孩为我们而生",                        # 204
    "虚妄世界，我要向你告别",                        # 205
    "我们在天上的父",                                # 206
    "求你施恩赐我们平安",                            # 207
    "我从高天降临而来",                              # 208
    "我决不离弃上帝",                                # 209
    "我心哪，醒起",                                  # 210
    "醒来，那声音呼唤我们",                          # 211
    "我心哪，你为何忧愁",                            # 212
    "我又何必忧伤愁烦",                              # 213
    "上帝所行的尽都美善",                            # 214
    "我心哪，你为何忧愁",                            # 215
    "我的灵啊，你为何如此忧愁",                      # 216
    "我何必眷恋这世界",                              # 217
    "愿我上帝的旨意常常成就",                        # 218
    "愿我上帝的旨意常常成就",                        # 219
    "我的灵啊，你又何必忧虑",                        # 220
    "我心哪，撇下这些念头",                          # 221
    "属世的荣耀与今生的财物",                        # 222
    "当我陷于惧怕与困苦",                            # 223
    "当我大限将至之时",                              # 224
    "当我们陷入极深的苦难",                          # 225
    "信靠上帝的人根基稳固",                          # 226
    "住在至高者隐密处的人",                          # 227
    "凡单单让上帝掌权的人",                          # 228
    "凡单单让上帝掌权的人",                          # 229
    "谁知我的终期何等临近",                          # 230
    "振作吧，我的心灵",                              # 231
    "我的灵啊，你在我里面何等忧愁",                  # 232
    "晨星何等明亮",                                  # 233
    "我们这些基督徒",                                # 234
    "我们都信独一上帝",                              # 235
    "若非上帝赐恩于家",                              # 236
    "若非主上帝与我们同在",                          # 237
    "我当逃往何处",                                  # 238
    "这时若非上帝与我们同在",                        # 239
    "进入你的城门吧",                                # 240
]

assert len(titles) == len(EN) == len(ZH), \
    f"count mismatch: titles={len(titles)} EN={len(EN)} ZH={len(ZH)}"

out = {}
for de, en, zh in zip(titles, EN, ZH):
    assert en and en.strip(), f"empty EN for {de!r}"
    assert zh and zh.strip(), f"empty ZH for {de!r}"
    out[de] = {"en": en.strip(), "zh": zh.strip()}

with open(os.path.join(HERE, "titles.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1, sort_keys=True)

print(f"wrote titles.json with {len(out)} entries")
