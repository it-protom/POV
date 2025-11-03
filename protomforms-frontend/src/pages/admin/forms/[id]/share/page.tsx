import React from 'react';
"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Copy, Link as LinkIcon, Mail, MessageSquare, Share2, Globe, Lock, Calendar, Clock, CheckCircle, XCircle, QrCode, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn, getPublicUrl } from "@/lib/utils";

interface Form {
  id: string;
  title: string;
  description?: string;
  type: "SURVEY" | "QUIZ";
  isAnonymous: boolean;
  allowEdit: boolean;
  showResults: boolean;
  thankYouMessage?: string;
  opensAt?: string;
  closesAt?: string;
  theme?: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

export default function ShareFormPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [opensAt, setOpensAt] = useState<Date | undefined>(undefined);
  const [closesAt, setClosesAt] = useState<Date | undefined>(undefined);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carica i dati del form
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch form");
        }
        const data = await response.json();
        setForm(data);
        
        // Imposta l'URL di condivisione usando l'URL pubblico corretto
        const publicUrl = getPublicUrl();
        setShareUrl(`${publicUrl}/forms/${params.id}`);
        
        // Imposta i valori iniziali
        if (data.opensAt) setOpensAt(new Date(data.opensAt));
        if (data.closesAt) setClosesAt(new Date(data.closesAt));
        setIsAnonymous(data.isAnonymous);
        setAllowEdit(data.allowEdit);
        setShowResults(data.showResults);
        
        // Imposta il messaggio email predefinito con URL pubblico
        setEmailSubject(`Invito a compilare il form: ${data.title}`);
        setEmailMessage(`Gentile utente,\n\nTi invitiamo a compilare il seguente form: ${data.title}\n\nPuoi accedere al form al seguente link:\n${publicUrl}/forms/${params.id}\n\nGrazie per il tuo contributo!\n\nCordiali saluti,\nProtomForms by Protom Group`);
      } catch (error) {
        console.error("Error fetching form:", error);
        toast.error("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [params.id]);

  // Copia l'URL negli appunti
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Invia email di invito
  const sendInviteEmails = async () => {
    if (!emailRecipients.trim()) {
      toast.error("Inserisci almeno un indirizzo email");
      return;
    }

    // Parsing degli indirizzi email (separati da virgola, spazio o punto e virgola)
    const recipients = emailRecipients
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (recipients.length === 0) {
      toast.error("Inserisci almeno un indirizzo email valido");
      return;
    }

    // Validazione email base
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Indirizzi email non validi: ${invalidEmails.join(', ')}`);
      return;
    }

    setEmailSending(true);
    try {
      const response = await fetch(`/api/forms/${params.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipients,
          subject: emailSubject,
          message: emailMessage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore durante l\'invio delle email');
      }

      const result = await response.json();
      toast.success(`Inviti inviati con successo a ${result.recipients.length} destinatario/i!`);
      
      // Reset form
      setEmailRecipients('');
      const publicUrl = getPublicUrl();
      setEmailSubject(`Invito a compilare il form: ${form?.title || ''}`);
      setEmailMessage(`Gentile utente,\n\nTi invitiamo a compilare il seguente form: ${form?.title || ''}\n\nPuoi accedere al form al seguente link:\n${publicUrl}/forms/${params.id}\n\nGrazie per il tuo contributo!\n\nCordiali saluti,\nProtomForms by Protom Group`);
    } catch (error: any) {
      console.error("Error sending invitations:", error);
      toast.error(error.message || "Errore durante l'invio delle email");
    } finally {
      setEmailSending(false);
    }
  };

  // Salva le impostazioni di condivisione
  const saveShareSettings = async () => {
    if (!form) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/forms/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          opensAt: opensAt?.toISOString(),
          closesAt: closesAt?.toISOString(),
          isAnonymous,
          allowEdit,
          showResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update form settings");
      }

      toast.success("Share settings updated successfully");
    } catch (error) {
      console.error("Error updating form settings:", error);
      toast.error("Failed to update share settings");
    } finally {
      setSaving(false);
    }
  };

  // Genera il codice QR
  const generateQRCode = () => {
    // Qui andrebbe implementata la logica per generare il codice QR
    // Per ora restituiamo un URL di esempio
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  };

  if (loading) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-blue-700 text-lg">Loading share settings...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="form-page container mx-auto py-8 animate-fade-in">
        <div className="form-card p-8 text-center">
          <p className="text-red-600 text-lg">Form not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/admin/forms/${params.id}`}>
              <Button variant="ghost" className="form-button-secondary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Form
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Share Form</h1>
              <p className="text-gray-500">{form.title}</p>
            </div>
          </div>
          
          <Button
            onClick={saveShareSettings}
            disabled={saving}
            className="form-button-primary"
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="form-card shadow-lg animate-slide-in">
              <CardHeader className="form-card-header border-b">
                <CardTitle className="text-xl font-bold">Share Options</CardTitle>
                <CardDescription>Choose how you want to share your form</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs defaultValue="link" className="w-full">
                  <TabsList className="grid grid-cols-3 mb-6">
                    <TabsTrigger value="link" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Link
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Social
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="link" className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="share-url">Share Link</Label>
                      <div className="flex">
                        <Input
                          id="share-url"
                          value={shareUrl}
                          readOnly
                          className="rounded-r-none"
                        />
                        <Button
                          onClick={copyToClipboard}
                          className="rounded-l-none"
                          variant="outline"
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Anyone with this link can access your form
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Label>QR Code</Label>
                      <div className="mt-2 p-4 border rounded-lg flex justify-center">
                        <img
                          src={generateQRCode()}
                          alt="QR Code"
                          className="w-40 h-40"
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Scan this QR code to access the form on mobile devices
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="email" className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="email-recipients">Recipients</Label>
                      <Textarea
                        id="email-recipients"
                        placeholder="Enter email addresses separated by commas"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <p className="text-sm text-gray-500">
                        Separate multiple email addresses with commas
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="email-subject">Subject</Label>
                      <Input
                        id="email-subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="email-message">Message</Label>
                      <Textarea
                        id="email-message"
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        onClick={sendInviteEmails}
                        disabled={emailSending || !emailRecipients.trim()}
                        className="w-full"
                      >
                        {emailSending ? "Sending..." : "Send Invitations"}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="social" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                        <Facebook className="h-6 w-6 text-blue-600" />
                        <span>Facebook</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                        <Twitter className="h-6 w-6 text-blue-400" />
                        <span>Twitter</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                        <Linkedin className="h-6 w-6 text-blue-700" />
                        <span>LinkedIn</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-green-500" />
                        <span>Messenger</span>
                      </Button>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm text-gray-500 text-center">
                        Click on a platform to share your form
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
        
          </div>
          
          <div className="space-y-6">
            <Card className="form-card shadow-lg animate-slide-in">
              <CardHeader className="form-card-header border-b">
                <CardTitle className="text-xl font-bold">Privacy Settings</CardTitle>
                <CardDescription>Control who can access your form</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anonymous Responses</Label>
                    <p className="text-sm text-gray-500">
                      Don't collect respondent information
                    </p>
                  </div>
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Editing</Label>
                    <p className="text-sm text-gray-500">
                      Let respondents edit their submissions
                    </p>
                  </div>
                  <Switch
                    checked={allowEdit}
                    onCheckedChange={setAllowEdit}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Results</Label>
                    <p className="text-sm text-gray-500">
                      Display results to respondents
                    </p>
                  </div>
                  <Switch
                    checked={showResults}
                    onCheckedChange={setShowResults}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="form-card shadow-lg animate-slide-in">
              <CardHeader className="form-card-header border-b">
                <CardTitle className="text-xl font-bold">Form Preview</CardTitle>
                <CardDescription>See how your form will appear</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-lg">{form.title}</h3>
                    <p className="text-gray-500 mt-1">{form.description || "No description provided"}</p>
                    <Button className="mt-4" variant="outline">
                      Preview Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 