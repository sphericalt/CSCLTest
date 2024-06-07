import { store } from "../main.js";
import { embed } from "../util.js";
import { score, calculateAverageRatings } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level && level.id!=0">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <h3 v-if="averageRatings[level.id] !== 69" style="margin-top:-5px;margin-bottom:-10px">Average Rating: {{ averageRatings[level.id] }}/10</h3>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, 100) }}</p>
                        </li>
                        <li>
                            <div v-if="level.id == 4" class="type-title-sm">GDShare File</div>
                            <div class="type-title-sm" v-else>ID</div>
                            <p v-if="level.id == 4"><a :href="level['levelDownload']" target="_blank"><u>Download</u></a></p>
                            <p v-else>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Broken FPS</div>
                            <p v-if="level['brokenHz']">{{ level.brokenHz }}</p>
                            <p v-else>None</p>
                        </li>
                        
                    </ul>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Song</div>
                            <p v-if="level['song-link']"><a :href="level['song-link']" target="_blank"><u>{{ level['song-title'] }}</u></a></p>
                            <p v-else>{{ level['song-title'] }}</p>
                        </li>
                    </ul>
                    
                    <div>
                    <h2>Records</h2>
                    <p style="margin-top:17px" v-if="selected + 1 > 150">This level does not accept new records.</p>
                    <p style="margin-top:17px" v-else-if="level.records.length == 0"><b>1</b> victor</p>
                    <p style="margin-top:17px" v-else><b>{{ level.records.length + 1 }}</b> victors</p>
                    </div>
                    
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p v-if="record.rating > 10">10/10</p>
                                <p v-else-if="record.rating < 0">0/10</p>
                                <p v-else-if="record['rating']">{{ Math.round(record.rating) }}/10</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}FPS</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a>. Some code from <a href="https://laylist.pages.dev/" target="_blank">The Layout List</a>.</p>
                    </div>
                    <div class="og">
                    <p class="type-label-md">Find an issue with the website? (NOT the list itself). <a href="https://github.com/sphericle/ClicksyncChallengeList/issues" target="_blank">Report it on the website!</a>.</p>
                </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        Achieved the record without using hacks (however, Click Between Frames is allowed.) A list of allowed hacks in Mega Hack can be found <a href="docs.google.com/spreadsheets/d/1cDye-bCkyKu9TH4g4pxKSYr1bk8BFJzzWW1YcfB5uvE/view"><u>here.</u></a>
                    </p>
                    <p>
                        FPS Bypass is allowed, but Physics Bypass is banned.
                    </p>
                    <p>
                        You must have Cheat Indicator enabled in your completion, including the Show on Endscreen setting. Unmodded versions of GD are exempt from this.
                    </p>
                    <p>
                        If you do not have any mods installed (including MegaHack, Geode), please enable the Show Info Label setting.
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
                    </p>
                    <p>
                        Achieved the record on the main GD servers, not a private server.
                    </p>
                    <p>
                        Have audible, unedited clicks or taps in the video.
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt.
                    </p>
                    <p>
                        Do not use secret routes or bug routes
                    </p>
                    <p>
                        You cannot have another person help you with 2 player levels. You also must show a handcam in your completion if the level is 2p.
                    </p>
                    <p>
                        Recording must capture entire game window.
                    </p>
                    





                    <p> 




                    </p>
                    <p>Join the <u><a href="https://discord.gg/W7Eqqj8NG2">Discord</a></u> to submit a record or challenge!</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();
        this.averageRatings = calculateAverageRatings(this.list);

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        calculateAverageRatings,
    },
};
