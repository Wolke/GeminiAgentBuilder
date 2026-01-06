/**
 * G8N - GAS Engine
 * Handles tool execution and workflow logic
 */

const Engine = {
    /**
     * Save workflow definition to Script Properties
     */
    syncWorkflow(workflow) {
        const json = JSON.stringify(workflow);
        // GAS Properties have size limit (9KB), for larger workflows need Drive or split
        // For MVP, we'll try Properties first or warn
        if (json.length > 9000) {
            // Fallback: Save to a File in Drive
            const filename = `g8n_workflow_${workflow.id}.json`;
            const files = DriveApp.getFilesByName(filename);
            let file;
            if (files.hasNext()) {
                file = files.next();
                file.setContent(json);
            } else {
                DriveApp.createFile(filename, json, MimeType.PLAIN_TEXT);
            }
            return { storage: 'drive', id: workflow.id };
        } else {
            PropertiesService.getScriptProperties().setProperty('CURRENT_WORKFLOW', json);
            return { storage: 'properties', id: workflow.id };
        }
    },

    /**
     * Execute a specific tool
     */
    executeTool(toolType, config) {
        switch (toolType) {
            case 'sheets':
                return Tools.sheets(config);
            case 'gmail':
                return Tools.gmail(config);
            case 'drive':
                return Tools.drive(config);
            case 'calendar':
                return Tools.calendar(config);
            case 'youtube':
                return Tools.youtube(config);
            default:
                throw new Error(`Tool type not supported in GAS: ${toolType}`);
        }
    }
};

/**
 * Tool Implementations
 */
const Tools = {
    sheets(config) {
        const { spreadsheetId, sheetName, action, range, values } = config;
        // Default to 'read' if not specified, or infer from props

        if (spreadsheetId) {
            const ss = SpreadsheetApp.openById(spreadsheetId);
            const sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];

            if (!sheet) throw new Error(`Sheet ${sheetName} not found`);

            // Basic Read
            if (!action || action === 'read') {
                const dataRange = range ? sheet.getRange(range) : sheet.getDataRange();
                return dataRange.getValues();
            }

            // Basic Write (Append)
            if (action === 'append' && values) {
                sheet.appendRow(Array.isArray(values) ? values : [values]);
                return { success: true, message: 'Row appended' };
            }
        }

        return { error: 'Invalid Sheets configuration' };
    },

    gmail(config) {
        const { to, subject, body, action } = config;

        // Send Email
        if (to && subject && body) {
            GmailApp.sendEmail(to, subject, body);
            return { success: true, message: 'Email sent' };
        }

        // List Drafts (example)
        if (action === 'list_drafts') {
            const drafts = GmailApp.getDrafts();
            return drafts.map(d => ({ id: d.getId(), subject: d.getMessage().getSubject() }));
        }

        return { error: 'Invalid Gmail configuration' };
    },

    drive(config) {
        const { query, action, fileName, content } = config;

        if (action === 'search' || query) {
            const files = DriveApp.searchFiles(query || 'trashed = false');
            const results = [];
            while (files.hasNext() && results.length < 10) {
                const f = files.next();
                results.push({ name: f.getName(), id: f.getId(), url: f.getUrl() });
            }
            return results;
        }

        if (action === 'create' && fileName && content) {
            const file = DriveApp.createFile(fileName, content);
            return { id: file.getId(), url: file.getUrl() };
        }

        return { error: 'Invalid Drive configuration' };
    },

    calendar(config) {
        const { startTime, endTime, title, description, action } = config;

        if (action === 'create_event' || (startTime && endTime && title)) {
            const event = CalendarApp.getDefaultCalendar().createEvent(
                title,
                new Date(startTime),
                new Date(endTime),
                { description }
            );
            return { id: event.getId(), link: 'Link not available directly' };
        }

        // List upcoming
        const events = CalendarApp.getDefaultCalendar().getEvents(new Date(), new Date(Date.now() + 86400000 * 7));
        return events.map(e => ({ title: e.getTitle(), start: e.getStartTime(), end: e.getEndTime() }));
    },

    youtube(config) {
        // Requires Advanced Service enabled in GAS
        try {
            if (config.action === 'search') {
                const results = YouTube.Search.list('id,snippet', {
                    q: config.query,
                    maxResults: 5
                });
                return results.items;
            }
        } catch (e) {
            return { error: 'YouTube API not enabled or error: ' + e.toString() };
        }
        return { error: 'YouTube action not supported' };
    }
};
