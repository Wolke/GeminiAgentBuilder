/**
 * G8N - GAS Backend Entry Point
 * Handles HTTP requests and routing
 */

function doGet(e) {
    return HtmlService.createHtmlOutput('G8N Backend is running. Please use POST requests for actions.');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const result = Router.dispatch(data);

        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            data: result
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Ping function for connection testing
 */
function ping() {
    return 'pong';
}
