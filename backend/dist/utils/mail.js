"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const microsoft_graph_client_1 = require("@microsoft/microsoft-graph-client");
const identity_1 = require("@azure/identity");
function getGraphClient() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    if (!tenantId || !clientId || !clientSecret)
        throw new Error("Azure AD credentials not set in env");
    const credential = new identity_1.ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = {
        getAccessToken: async () => {
            const token = await credential.getToken("https://graph.microsoft.com/.default");
            return token?.token || "";
        },
    };
    const client = microsoft_graph_client_1.Client.initWithMiddleware({
        authProvider,
    });
    return client;
}
async function sendMail(opts) {
    const client = getGraphClient();
    const from = process.env.EMAIL_FROM;
    if (!from)
        throw new Error("EMAIL_FROM not set in env");
    const message = {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
    };
    // Send as the configured user (requires app permission to send as user or use a service account)
    try {
        await client.api(`/users/${from}/sendMail`).post({ message, saveToSentItems: false });
        console.log("[mail] sent to", opts.to);
        return true;
    }
    catch (err) {
        console.error("[mail] Graph sendMail error:", err);
        throw err;
    }
}
