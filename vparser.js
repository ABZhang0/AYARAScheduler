/**
 * A particular section of a course
 * @typedef {Object} Section
 * @property {string} status            // available or full
 * @property {string} sectionName       // course name
 * @property {string} sectionID         // class number
 * @property {string} activity          // type of class (lecture/lab/etc.)
 * @property {Time} times               // class times
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
        while (match !== null) {
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
 * Parses all sections of a certain course, filters for specific term
 * @param {string} campus 
 * @param {string} year 
 * @param {string} session 
 * @param {string} subject 
 * @param {string} course 
 * @param {string} term 
 * @param {sectionsCallback} completion 
 */