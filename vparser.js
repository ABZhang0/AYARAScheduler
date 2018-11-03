/**
 * A particular section of a course
 * @typedef {Object} Section
 * @property {string} status            // available or full
 * @property {string} sectionName       // course name
 * @property {string} sectionID         // class number
 * @property {string} activity          // type of class (lecture/lab/etc.)
 * @property {Time} times               // class times
 * @property {string} length            // class length
 * @property {Object.<string, Section[]>} subactivities
 */

 /**
 * Time blocks defined by start and end times in particular days
 * @typedef {Object} Time
 * @property {number} days
 * @property {LocalTime} beginTime
 * @property {LocalTime} endTime
 */

 /**
 * Subactivities of a Lecture such as Laboratory or Tutorial. When there is no Lecture,
 * the next available item (Laboratory or Tutorial) is chosen as the main activity and
 * the item after it is the subactivity.
 * @typedef {Object.<string, Section[]>} Subactivities
 */

 /**
 * @callback sessionsCallback
 * @param {string[]} sessions
 */

/**
 * @param {sessionsCallback} completion
 */
function parseSessions(completion) {
    function parse(data) {
        var sessions = []

        var pattern = /"(\d{4})".*>(\d{4} \w+)/g;
        var match = pattern.exec(data)
        while ((match !== null) && (sessions.length < 5)) {
            sessions.push(/*match[1] + */match[2])
            match = pattern.exec(data);
        }
        completion(sessions)
    }
    $.ajax({ url: 'https://cors-anywhere.herokuapp.com/https://acad.app.vanderbilt.edu/more/SearchClasses!input.action', success: parse });
}

/**
 * @param {string} subject 
 * @param {string} course 
 * @returns {string}
 */
function urlForCourse(subject, course) {
    return `https://acad.app.vanderbilt.edu/more/SearchClassesExecute!search.action?keywords=${subject}%20${course}`
}

/**
 * @callback sectionsCallback
 * @param {Section[]} sections
 */

/**
 *
 * @param {string} session 
 * @param {string} subject 
 * @param {string} course 
 * @param {string} professor
 * @param {sectionsCallback} completion 
 * 
 */
function parseSections(session, subject, course, completion) {
    function parse(data) {
        var sections = []

        var parser = new DOMParser();
        try {
            var doc = $($.parseHTML(data))
            var blocks = doc.find('.classTable')

            for (let block of blocks) {
                var cSections = block.children[0].children.remove[0].remove[1]
                //console.log(cSections)
                for(let cSection of cSections) {
                    parseRow(cSection, sections)
                }
            }
        } catch (err) {
            console.log(err)
        }
        completion(postprocessSections(sections))
    }

    /**
     * @param {*} row 
     * @param {Section[]} sections 
     */
    function parseRow(row, sections) {
        let items = row.children
        let sectionName = $(items[0]).text()
        let length = $(items[1]).text()
        let activity = $(items[2]).text()
        let status = $(items[3]).text()
        // let interval = $(items[4]).text()
        let days = parseWeekdays($(items[4]).text())
        let beginTime = preprocessTime($(items[6]).text().slice(0, 5))
        let endTime = preprocessTime($(items[6]).text().slice(9, 14))
        // let comments = $(items[8]).text()
        // if (courseTerm !== term && courseTerm !== "1-2") {
        //     sections.push({ status: status, sectionName: sectionName, activity: activity, times: [] })
        //     return // Ignore terms that do not apply but take note
        // }
        if (sectionName === "") {
            sections[sections.length - 1].times.push({
                days: days,
                beginTime: beginTime,
                endTime: endTime
            })
            return
        }
        sections.push({
            status: status, sectionName: sectionName, activity: activity, times: [{
                days: days,
                beginTime: beginTime,
                endTime: endTime
            }]
        })
    }

    /**
     * Converts weekday string to mask
     * @param {string} weekdayString 
     * @returns {number}
     */
    function parseWeekdays(weekdayString) {
        let weekdayMask = Weekday.None
        let days = weekdayString.split("")
        for (day of days) {
            if (day === "M") weekdayMask += Weekday.Monday
            if (day === "T") weekdayMask += Weekday.Tuesday
            if (day === "W") weekdayMask += Weekday.Wednesday
            if (day === "R") weekdayMask += Weekday.Thursday
            if (day === "F") weekdayMask += Weekday.Friday
        }
        return weekdayMask
    }

    /**
     * @param {Section[]} sections 
     * @returns {Section[]}
     */
    function postprocessSections(sections) {
        sections = sections.filter(function (section) {
            // filter out all sections with no times or waitlist
            return (section.times.length > 0 &&
                section.activity !== "Waiting List" &&
                section.times[0].days != Weekday.None &&
                section.times[0].beginTime !== "" &&
                section.times[0].endTime !== "")
        })
        if (sections.length <= 0) return
        // take the first item's activity as the main activity, such as "Lecture" or "Laboratory"
        let mainActivity = sections[0].activity
        newSections = []
        for (section of sections) {
            if (section.activity === mainActivity) {
                section.subactivities = {}
                newSections.push(section)
                continue
            }
            var subactivities = newSections[newSections.length - 1].subactivities
            if (!(section.activity in subactivities)) {
                subactivities[section.activity] = []
            }
            subactivities[section.activity].push(section)
        }
        // if there are sections that have no subactivities but the last section has subactivities, then take that. (BIOL 200)
        for (section of newSections) {
            if (Object.keys(section.subactivities).length === 0) {
                section.subactivities = newSections[newSections.length - 1].subactivities
            }
        }

        return newSections
    }

    /**
     * @param {string} time 
     * @returns {LocalTime}
     */
    function preprocessTime(time) {
        if (time.length != 6) {
            // invalid time
            return ""
        } else {
            var timeTF;
            if (time.split().pop() === "a") {
                timeTF = LocalTime.parse(time)
                return timeTF;
            } else {
                timeTF = LocalTime.parse(time)
                timeTF.plusHours(12)
                return timeTF;
            }
        }
    }

    $.ajax({ url: 'https://cors-anywhere.herokuapp.com/' + urlForCourse(subject, course), success: parse });
}