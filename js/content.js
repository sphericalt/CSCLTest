import { round, score } from './score.js';

/**
 * Path to directory containing `_list.json` and all levels
 */
const dir = '/data';



export async function fetchList() {
    try {
        const listResult = await fetch(`${dir}/_list.json`);
        if (!listResult.ok) {
            const errorText = await listResult.text();
            throw new Error(`Failed to fetch _list.json: ${listResult.status} ${listResult.statusText}. Response: ${errorText}`);
        }
        const list = await listResult.json();
        return await Promise.all(
            list.map(async (path, rank) => {
                try {
                    const levelResult = await fetch(`${dir}/${path}.json`);
                    if (!levelResult.ok) {
                        const errorText = await levelResult.text();
                        throw new Error(`Failed to fetch ${path}.json: ${levelResult.status} ${levelResult.statusText}. Response: ${errorText}`);
                    }
                    const level = await levelResult.json();

                    // Fetch banned users
                    
                    // Remove records from banned users
                    

                    return [
                        {
                            ...level,
                            path,
                            records: level.records.sort((a, b) => b.percent - a.percent),
                        },
                        null,
                    ];
                } catch (error) {
                    console.error(`Failed to load level #${rank + 1} ${path}:`, error);
                    return [null, path];
                }
            })
        );
    } catch (error) {
        console.error('Failed to load list:', error);
        return null;
    }
}

export async function fetchEditors() {
    try {
        const editorsResults = await fetch(`${dir}/_editors.json`);
        if (!editorsResults.ok) {
            const errorText = await editorsResults.text();
            throw new Error(`Failed to fetch _editors.json: ${editorsResults.status} ${editorsResults.statusText}. Response: ${errorText}`);
        }
        const editors = await editorsResults.json();
        return editors;
    } catch (error) {
        console.error('Error fetching editors:', error);
        return null;
    }
}

export async function fetchLeaderboard() {
    
    const list = await fetchList();

    if (!list) {
        return [[], ['Failed to fetch level list']];
    }

    const scoreMap = {};
    const errs = [];
    list.forEach(([level, err], rank) => {
        if (err) {
            errs.push(err);
            return;
        }

        

       

        // Check if verifier is banned
        let verifier = Object.keys(scoreMap).find(
            (u) => u.toLowerCase() === level.verifier.toLowerCase(),
        ) || level.verifier;

       

        scoreMap[verifier] ??= {
            verified: [],
            completed: [],
            progressed: [],
        };
        const { verified } = scoreMap[verifier];
        verified.push({
            rank: rank + 1,
            level: level.name,
            score: score(rank + 1, 100, level.percentToQualify),
            link: level.verification,
        });

        // Records
        level.records.forEach((record) => {
            const user = Object.keys(scoreMap).find(
                (u) => u.toLowerCase() === record.user.toLowerCase(),
            ) || record.user;

            

            scoreMap[user] ??= {
                verified: [],
                completed: [],
                progressed: [],
            };
            const { completed, progressed } = scoreMap[user];
            if (record.percent === 100) {
                completed.push({
                    rank: rank + 1,
                    level: level.name,
                    score: score(rank + 1, 100, level.percentToQualify),
                    link: record.link,
                });
                return;
            }

            progressed.push({
                rank: rank + 1,
                level: level.name,
                percent: record.percent,
                score: score(rank + 1, record.percent, level.percentToQualify),
                link: record.link,
            });
        });
    });

    // Wrap in extra Object containing the user and total score
    const res = Object.entries(scoreMap).map(([user, scores]) => {
        const { verified, completed, progressed } = scores;
        const total = [verified, completed, progressed]
            .flat()
            .reduce((prev, cur) => prev + cur.score, 0);

        return {
            user,
            total: round(total),
            ...scores,
        };
    });

    // Sort by total score
    return [res.sort((a, b) => b.total - a.total), errs];
}
