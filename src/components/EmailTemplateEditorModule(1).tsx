import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Save, FileText, CheckCircle2, AlertCircle, Eye, Edit3, Sparkles } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  text: string;
  html: string;
}

interface EmailTemplateEditorModuleProps {
  token: string | null;
}

export default function EmailTemplateEditorModule({ token }: EmailTemplateEditorModuleProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'preview'>('edit');

  // Test Send states
  const [testEmailAddress, setTestEmailAddress] = useState('mosesmwamuye97@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Form states for selected template
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [html, setHtml] = useState('');

  const fetchTemplates = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/admin/email-templates', { headers });
      setTemplates(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedTemplate(first);
        setSubject(first.subject);
        setText(first.text);
        setHtml(first.html);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to fetch email templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [token]);

  const handleSelectTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setSubject(tpl.subject);
    setText(tpl.text);
    setHtml(tpl.html);
    setSuccess(null);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTemplate) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(`/api/admin/email-templates/${selectedTemplate.id}`, {
        subject,
        text,
        html
      }, { headers });

      setSuccess(res.data.message || 'Template saved successfully!');
      
      // Update local list
      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? { ...t, subject, text, html } : t));
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save email template.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTemplate) return;

    setSendingTest(true);
    setTestSuccess(null);
    setTestError(null);

    const finalHtml = renderPreviewHtml();
    const finalText = renderPreviewText();

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post('/api/admin/email-templates/test-send', {
        to: testEmailAddress,
        subject: subject,
        text: finalText,
        html: finalHtml
      }, { headers });

      setTestSuccess(res.data.message || 'Test email dispatched successfully!');
    } catch (e: any) {
      setTestError(e.response?.data?.error || 'Failed to dispatch test email.');
    } finally {
      setSendingTest(false);
    }
  };

  // Helper to replace standard placeholders with mockup values for live preview
  const renderPreviewHtml = () => {
    if (!html) return '';
    let preview = html;
    const mockupVariables: Record<string, string> = {
      firstName: 'John',
      lastName: 'Doe',
      verificationCode: '582914',
      generatedUsername: 'doe.john',
      generatedPassword: 'Secured@123',
      username: 'johndoe',
      resetCode: '741258'
    };

    for (const [key, value] of Object.entries(mockupVariables)) {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return preview;
  };

  const renderPreviewText = () => {
    if (!text) return '';
    let preview = text;
    const mockupVariables: Record<string, string> = {
      firstName: 'John',
      lastName: 'Doe',
      verificationCode: '582914',
      generatedUsername: 'doe.john',
      generatedPassword: 'Secured@123',
      username: 'johndoe',
      resetCode: '741258'
    };

    for (const [key, value] of Object.entries(mockupVariables)) {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return preview;
  };

  const getVariablesForTemplate = (id: string) => {
    switch (id) {
      case 'STUDENT_ONBOARDING':
        return ['{{firstName}}', '{{lastName}}', '{{verificationCode}}'];
      case 'STAFF_ONBOARDING':
        return ['{{firstName}}', '{{lastName}}', '{{generatedUsername}}', '{{generatedPassword}}', '{{verificationCode}}'];
      case 'PASSWORD_RESET':
        return ['{{username}}', '{{resetCode}}'];
      default:
        return [];
    }
  };

  return (
    <div id="email-template-editor-root" className="space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            Email Template Editor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize the system-generated automated emails sent to students, faculty, and administrative staff.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600 text-sm">Retrieving registered templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar list of templates */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Select Template
            </h2>
            <div className="space-y-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-sm block">
                    {tpl.name}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded self-start">
                    {tpl.id}
                  </span>
                </button>
              ))}
            </div>

            {/* Variable Tokens Reference Box */}
            {selectedTemplate && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Available Placeholders
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  These placeholders will be dynamically replaced when sending the email:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getVariablesForTemplate(selectedTemplate.id).map((v) => (
                    <code
                      key={v}
                      className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100"
                    >
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main workspace */}
          <div className="lg:col-span-3">
            {selectedTemplate ? (
              <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Actions */}
                <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      ID: <span className="font-mono font-bold">{selectedTemplate.id}</span>
                    </p>
                  </div>

                  {/* Mode switcher (Edit / Live Preview) */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('edit')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        activeSubTab === 'edit'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                        activeSubTab === 'preview'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Live Preview
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                {success && (
                  <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Workspace body */}
                {activeSubTab === 'edit' ? (
                  <div className="p-6 space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Email Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm outline-none"
                        placeholder="Enter email subject line"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Monospace Text Template */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Plain Text Fallback
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            plain/text
                          </span>
                        </div>
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          required
                          rows={12}
                          className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm outline-none resize-y"
                          placeholder="Plain text email body fallback..."
                        />
                      </div>

                      {/* Monospace HTML Template */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            HTML Body Code
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            text/html
                          </span>
                        </div>
                        <textarea
                          value={html}
                          onChange={(e) => setHtml(e.target.value)}
                          required
                          rows={12}
                          className="w-full font-mono text-xs rounded-xl border border-slate-200 p-3.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-sm outline-none resize-y"
                          placeholder="HTML body code..."
                        />
                      </div>
                    </div>

                    {/* Send Test Email Live Verification Widget */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mt-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          Verify Real Email Dispatch
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Test your newly configured real Gmail/SMTP transport settings. We will replace placeholders with test values and send a real notification to your inbox.
                        </p>
                      </div>

                      {testSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{testSuccess}</span>
                        </div>
                      )}

                      {testError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{testError}</span>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            value={testEmailAddress}
                            onChange={(e) => setTestEmailAddress(e.target.value)}
                            className="w-full text-xs rounded-xl border border-slate-250 bg-white px-3.5 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-xs outline-none"
                            placeholder="Enter recipient email address..."
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={sendingTest || !testEmailAddress}
                          className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {sendingTest ? 'Sending Real Test...' : 'Send Real Test Email'}
                        </button>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Template'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-6 bg-slate-50">
                    {/* Live Preview UI */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden max-w-2xl mx-auto">
                      {/* Simulated email header bar */}
                      <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 text-xs space-y-1">
                        <div>
                          <span className="text-slate-400 font-medium">To:</span> <span className="text-slate-700 font-mono">user@example.edu</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Subject:</span> <span className="text-slate-800 font-semibold">{subject || '(No Subject)'}</span>
                        </div>
                      </div>

                      {/* Simulated email body preview */}
                      <div className="p-6 overflow-auto max-h-[400px]">
                        {html ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: renderPreviewHtml() }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                            {renderPreviewText()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-700 text-base">No Template Selected</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Please select a template from the sidebar column to initialize the visual customizing workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
