export const ENGINE_JS = `const Engine = {
  executeTool(toolType, config) {
    switch (toolType) {
      case 'sheets': return Tools.sheets(config);
      case 'gmail': return Tools.gmail(config);
      case 'drive': return Tools.drive(config);
      case 'calendar': return Tools.calendar(config);
      case 'youtube': return Tools.youtube(config);
      default: throw new Error('Tool not supported: ' + toolType);
    }
  }
};

const Tools = {
  sheets(config) {
    if (config.spreadsheetId) {
      const ss = SpreadsheetApp.openById(config.spreadsheetId);
      const sheet = config.sheetName ? ss.getSheetByName(config.sheetName) : ss.getSheets()[0];
      if (!sheet) throw new Error('Sheet not found');
      if (config.action === 'append' && config.values) {
        sheet.appendRow(Array.isArray(config.values) ? config.values : [config.values]);
        return { success: true };
      }
      return sheet.getDataRange().getValues();
    }
    return { error: 'Invalid config' };
  },
  gmail(config) {
    if (config.to && config.subject && config.body) {
      GmailApp.sendEmail(config.to, config.subject, config.body);
      return { success: true };
    }
    return { error: 'Invalid config' };
  },
  drive(config) {
    if (config.query) {
      const files = DriveApp.searchFiles(config.query);
      const results = [];
      while (files.hasNext() && results.length < 10) {
        const f = files.next();
        results.push({ name: f.getName(), id: f.getId(), url: f.getUrl() });
      }
      return results;
    }
    return { error: 'Invalid config' };
  },
  calendar(config) {
    const events = CalendarApp.getDefaultCalendar().getEvents(new Date(), new Date(Date.now() + 604800000));
    return events.map(e => ({ title: e.getTitle(), start: e.getStartTime() }));
  },
  youtube(config) {
    return { error: 'YouTube requires Advanced Service' };
  }
};`;
