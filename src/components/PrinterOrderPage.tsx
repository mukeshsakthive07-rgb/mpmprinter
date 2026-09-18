import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useApp } from '../context/AppContext';
import { RocketLaunchOverlay } from './RocketLaunchOverlay';
import { SwipeToOrderButton } from './SwipeToOrderButton';
import type { PrintServiceId, UploadedDoc, PrintServiceRate } from '../types';
import {
  FileText,
  Upload,
  Layers,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Phone,
  User,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  FileCheck2,
  Info,
  ChevronRight,
  Printer,
  Loader2
} from 'lucide-react';



export const getFileCategory = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': case 'doc': case 'docx': case 'odt': case 'txt':
      return { id: 'documents', title: 'Documents', icon: '📄' };
    case 'xls': case 'xlsx': case 'ods':
      return { id: 'spreadsheets', title: 'Spreadsheets', icon: '📊' };
    case 'ppt': case 'pptx': case 'odp':
      return { id: 'presentations', title: 'Presentations', icon: '📽️' };
    case 'jpg': case 'jpeg': case 'png':
      return { id: 'images', title: 'Images', icon: '🖼️' };
    default:
      return { id: 'other', title: 'Other', icon: '📎' };
  }
};

export const PrinterOrderPage: React.FC = () => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const { createOrder, setActiveTab, settings, showToast } = useApp();

  const [isLaunching, setIsLaunching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Configuration State
  
  const [rates, setRates] = useState<Record<string, number>>({
    'bw-single': 1.0,
    'bw-double': 1.4,
    'colour': 6.8,
    'photo': 18.0
  });

  useEffect(() => {
    fetch('/api/rates')
      .then(res => res.json())
      .then(data => {
        if(data.rates) setRates(data.rates);
      })
      .catch(err => console.error("Failed to load rates:", err));
  }, []);

  const SERVICES = React.useMemo<PrintServiceRate[]>(() => [
    { id: 'bw-single', title: 'Single Side (B&W)', sub: 'Assignments & Notes', rate: rates['bw-single'] || 1.0, unit: 'page', icon: '📄', badge: 'Popular' },
    { id: 'bw-double', title: 'Double Side (B&W)', sub: 'Semester Study Material', rate: rates['bw-double'] || 1.4, unit: 'page', icon: '📑', badge: 'Value Saver' },
    { id: 'colour', title: 'Colour Print Out', sub: 'Project Reports & Portfolios', rate: rates['colour'] || 6.8, unit: 'page', icon: '🎨' },
    { id: 'photo', title: 'Photo Sheet (Glossy)', sub: 'High Quality Photos', rate: rates['photo'] || 18.0, unit: 'sheet', icon: '📸' }
  ], [rates]);

  const [selectedService, setSelectedService] = useState<PrintServiceId>('bw-single');
  const [copies, setCopies] = useState<number>(1);
  const [pageRange, setPageRange] = useState<string>('All');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'Legal'>('A4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');

  // Customer Contact State (Pre-filled from logged-in user account!)
  const [studentName, setStudentName] = useState<string>(user?.name || '');
  const [studentPhone, setStudentPhone] = useState<string>(user?.phone || '+91 1234567890');
  const [notes, setNotes] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    settings?.addresses?.find((a) => a.isDefault)?.addressLine || 'Campus Pickup Counter (MPM PRINTER)'
  );

  // Files State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDoc[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [orderSuccessModal, setOrderSuccessModal] = useState<any | null>(null);

  
  const activeRate = SERVICES.find((s) => s.id === selectedService) || SERVICES[0];

  // Base price calculation (Per Document)
  const grandTotal = React.useMemo(() => {
    return uploadedFiles.reduce((acc, file) => {
      const srvId = file.serviceId || selectedService;
      const fileCopies = file.copies || copies;
      const rateObj = SERVICES.find(s => s.id === srvId) || SERVICES[0];
      const pages = file.pageCount || 1;

      // Smart PDF Hybrid Billing if auto-detected
      if (file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour') {
        const bwRate = SERVICES.find(s => s.id === 'bw-single')?.rate || 1.0;
        const colourRate = SERVICES.find(s => s.id === 'colour')?.rate || 6.80;
        
        const mode = file.printMode || 'hybrid';
        if (mode === 'all-color') {
          return acc + (pages * colourRate * fileCopies);
        } else if (mode === 'all-bw') {
          return acc + (pages * bwRate * fileCopies);
        } else {
          return acc + (((file.bwPages * bwRate) + (file.colorPages * colourRate)) * fileCopies);
        }
      }

      return acc + (pages * rateObj.rate * fileCopies);
    }, 0);
  }, [uploadedFiles, selectedService, copies, SERVICES]);

  const totalPages = React.useMemo(() => {
    return uploadedFiles.reduce((acc, f) => acc + ((f.pageCount || 1) * (f.copies || copies)), 0);
  }, [uploadedFiles, copies]);

  const billSplit = React.useMemo(() => {
    let bwCount = 0;
    let colorCount = 0;
    let otherCost = 0;
    let hasHybrid = false;
    
    const bwRate = SERVICES.find(s => s.id === 'bw-single')?.rate || 1.0;
    const colourRate = SERVICES.find(s => s.id === 'colour')?.rate || 6.80;

    uploadedFiles.forEach(file => {
      const srvId = file.serviceId || selectedService;
      const fileCopies = file.copies || copies;
      const pages = file.pageCount || 1;
      
      if (file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour') {
        hasHybrid = true;
        const mode = file.printMode || 'hybrid';
        if (mode === 'all-color') {
          colorCount += (pages * fileCopies);
        } else if (mode === 'all-bw') {
          bwCount += (pages * fileCopies);
        } else {
          bwCount += (file.bwPages * fileCopies);
          colorCount += (file.colorPages * fileCopies);
        }
      } else if (srvId === 'bw-single' || srvId === 'bw-double') {
        bwCount += (pages * fileCopies);
      } else if (srvId === 'colour') {
        colorCount += (pages * fileCopies);
      } else {
        const rateObj = SERVICES.find(s => s.id === srvId) || SERVICES[0];
        otherCost += (pages * rateObj.rate * fileCopies);
      }
    });

    return {
      bwCount,
      colorCount,
      otherCost,
      bwRate,
      colourRate,
      bwTotal: bwCount * bwRate,
      colorTotal: colorCount * colourRate,
      hasHybrid
    };
  }, [uploadedFiles, selectedService, copies, SERVICES]);


  // File Upload Handler
  
  
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Refs to prevent state update on unmounted component
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatFileSize = (size: number | string | undefined): string => {
    if (!size) return '0 KB';
    if (typeof size === 'string' && (size.includes('KB') || size.includes('MB') || size.includes('Bytes') || size.includes('B'))) {
      return size;
    }
    const bytes = Number(size);
    if (isNaN(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFileList = async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    setIsSubmitting(true);
    
    const formData = new FormData();
    const filesArray = files.slice(0, 50);
    
    const SUPPORTED_EXTS = ['pdf', 'doc', 'docx', 'odt', 'txt', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp', 'jpg', 'jpeg', 'png'];
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    filesArray.forEach((file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext && SUPPORTED_EXTS.includes(ext)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      showToast(`Unsupported file type(s): ${invalidFiles.join(', ')}`, 'error');
    }

    if (validFiles.length === 0) {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    validFiles.forEach((file: File) => {
      formData.append('files', file);
    });

    // Immediate client-side PDF page count extraction for instant UI feedback
    const optimisticFiles = await Promise.all(validFiles.map(async (file) => {
      let pageCount = 1;
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'pdf') {
        try {
          const { PDFDocument } = await import('pdf-lib');
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const count = pdfDoc.getPageCount();
          if (count && count > 0) {
            pageCount = count;
          }
        } catch (clientPdfErr) {
          try {
            const arrayBuffer = await file.slice(0, 1024 * 300).arrayBuffer();
            const text = new TextDecoder('latin1').decode(arrayBuffer);
            const match = text.match(/\/Count\s+(\d+)/);
            if (match && match[1]) {
              pageCount = parseInt(match[1], 10);
            } else {
              const allText = new TextDecoder('latin1').decode(await file.arrayBuffer());
              const pageMatches = allText.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
              if (pageMatches) pageCount = pageMatches.length;
            }
          } catch(e) {}
        }
      }

      return {
        id: "temp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6) + "-" + file.name,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        pageCount: pageCount,
        bwPages: pageCount,
        colorPages: 0,
        colorPageList: [],
        printType: 'B&W',
        copies: 1,
        paperSize: 'A4',
        layout: 'Portrait',
        isAnalyzing: true
      };
    }));
    
    if (isMountedRef.current) {
      setUploadedFiles(prev => [...prev, ...optimisticFiles as any]);
    }

    try {
      setUploadProgress(0);
      showToast('Analyzing and uploading PDF document(s)...', 'info');
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (!isMountedRef.current) return;
        setIsSubmitting(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.files) {
              setUploadedFiles((prev) => {
                const nonAnalyzing = prev.filter(p => !p.isAnalyzing);
                const updatedFromBackend = data.files.map((f: any) => {
                  const existing = prev.find(p => p.name === f.name);
                  return {
                    id: f.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    name: f.name,
                    size: f.size,
                    type: f.type,
                    pageCount: f.pageCount,
                    bwPages: f.bwPages,
                    colorPages: f.colorPages,
                    colorPageList: f.colorPageList,
                    printType: f.printType,
                    printMode: f.printMode || 'hybrid',
                    serviceId: existing?.serviceId || selectedService,
                    copies: existing?.copies || copies,
                    paperSize: existing?.paperSize || paperSize,
                    layout: existing?.layout || orientation,
                    url: f.url,
                    isAnalyzing: false
                  };
                });
                return [...nonAnalyzing, ...updatedFromBackend];
              });
              showToast('PDF uploaded & page count verified successfully', 'success');
            } else {
              showToast(data.error || 'Failed to upload files', 'error');
            }
          } catch(e) {
            showToast('Invalid response from server', 'error');
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            showToast(data.error || 'Upload failed', 'error');
          } catch(e) {
            showToast('Upload failed', 'error');
          }
        }
      };

      xhr.onerror = () => {
        if (!isMountedRef.current) return;
        setIsSubmitting(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
        showToast('Upload failed. Check your connection.', 'error');
      };

      xhr.send(formData);
    } catch (err) {
      if (!isMountedRef.current) return;
      setIsSubmitting(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      console.error('Upload error:', err);
      showToast('Upload failed', 'error');
    }
  };

  const handleFilesAdded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processFileList(Array.from(e.target.files));
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(Array.from(e.dataTransfer.files));
    }
  };

  
  const handlePlaceOrder = async () => {
    if (!isOnline) {
      showToast('You are currently offline. Please reconnect to place an order.', 'error', '📡');
      return;
    }
    if (uploadedFiles.length === 0) {
      showToast('Please upload at least one document.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    const orderPayload = {
      customerPhone: studentPhone.trim(),
      customerName: studentName.trim(),
      serviceId: selectedService,
      serviceTitle: activeRate.title,
      rate: activeRate.rate,
      unit: activeRate.unit,
      copies,
      pageRange: pageRange.trim() || 'All Pages',
      paperSize,
      orientation,
      binding: 'none',
      bindingCost: 0,
      notes: notes.trim() || 'None',
      deliveryAddress,
      files: uploadedFiles,
      totalPrice: grandTotal,
    };

    try {
      const res = await createOrder(orderPayload);
      if (res.success && res.order) {
        setOrderSuccessModal(null);
        setIsLaunching(true);
        showToast('Order placed successfully!', 'success');
      } else {
        showToast(res.error || 'Could not place order. Please retry.', 'error', '❌');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppShareUrl = (order: any) => {
    let msg = `🖨️ *NEW PRINT ORDER - MPM PRINTER* 📄\n`;
    msg += `*Order ID:* #${order.orderId}\n`;
    msg += `------------------------------------\n`;
    msg += `👤 *Student:* ${order.customerName}\n`;
    msg += `📞 *WhatsApp:* ${order.customerPhone}\n`;
    msg += `📍 *Delivery/Pickup:* ${order.deliveryAddress}\n`;
    if (order.notes && order.notes !== 'None') msg += `📝 *Notes:* ${order.notes}\n`;
    msg += `------------------------------------\n`;
    msg += `📑 *Service:* ${order.serviceTitle}\n`;
    msg += `💰 *Rate:* ₹${order.rate}/${order.unit}\n`;
    msg += `📋 *Copies:* ${order.copies}\n`;
    msg += `📏 *Paper & Orientation:* ${order.paperSize}, ${order.orientation}\n`;
    msg += `💵 *Total Amount:* ₹${order.totalPrice.toFixed(2)}\n`;
    if (order.files && order.files.length > 0) {
      msg += `📎 *Attached Documents (${order.files.length}):*\n`;
      order.files.forEach((f: any, i: number) => {
        msg += `   ${i + 1}. ${f.name} (${f.size})\n`;
      });
    }
    msg += `------------------------------------\n`;
    msg += `_Placed via MPM PRINTER Web Application_`;
    return `https://wa.me/919443071443?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Top Welcome & Subtitle */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex flex-wrap gap-x-2">
            <span>Printer Order</span>
            <span className="bg-gradient-to-r from-[#00f0ff] to-[#00e676] bg-clip-text text-transparent font-extrabold">&amp; Document Upload</span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Welcome back, <span className="text-cyan-400 font-bold">{user?.name}</span>. Choose print options, upload your files, and place your order.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('orders')}
            className="px-5 py-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <span>View My Order Queue</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Services & Upload (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Official Print Rates Cards */}
          <div className="relative liquid-glass rounded-3xl p-6 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-xl">📁</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Select Print Service &amp; Rate
                </h3>
              </div>
              <span className="text-xs text-cyan-400 font-semibold text-right">
                Tap card to select
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map((srv) => {
                const isSelected = selectedService === srv.id;
                return (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedService(srv.id)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'liquid-glass-active scale-[1.02] z-10 animate-glitch'
                        : 'liquid-glass-sub hover:scale-[1.01] transition-all'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-1 shadow-lg">
                        <Check className="w-3.5 h-3.5" /> Selected
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-3xl drop-shadow-sm">{srv.icon}</div>
                        {!isSelected && <ChevronRight className="w-5 h-5 text-slate-500" />}
                      </div>
                      <h4 className="font-bold text-[15px] text-white leading-snug">
                        {srv.title}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {srv.sub}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-700/50 flex items-end justify-between">
                      <span className="font-fredoka text-3xl font-extrabold text-cyan-400 leading-none">
                        ₹{srv.rate.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium text-slate-400 pb-1">
                        / {srv.unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Document Upload Area */}
          <div className="relative rounded-3xl p-6 liquid-glass overflow-hidden text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-xl">📁</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Upload Documents to Print
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium text-right">
                {uploadedFiles.length} file(s) attached
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFilesAdded}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
            />

            {/* Upload Progress Bar */}
            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-[10px] text-center mt-1 text-slate-500">{uploadProgress}% Uploading...</p>
              </div>
            )}
            
            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
              className="relative z-10 liquid-glass-sub border-2 border-dashed border-cyan-400/40 hover:border-cyan-400 rounded-2xl p-8 text-center transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-[#00f0ff] to-[#00e676] text-slate-900 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-cyan-500/20">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-bold text-white text-sm">
                Click to upload or drag and drop files
              </p>
              <p className="text-xs text-[#cfcfcf] mt-1.5 font-medium">
                upload the pdf files
              </p>
            </div>

            {/* Attached Documents List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-6">
                {[
                  { id: 'documents', title: '📄 Documents', files: uploadedFiles.filter(f => getFileCategory(f.name).id === 'documents') },
                  { id: 'spreadsheets', title: '📊 Spreadsheets', files: uploadedFiles.filter(f => getFileCategory(f.name).id === 'spreadsheets') },
                  { id: 'presentations', title: '📽️ Presentations', files: uploadedFiles.filter(f => getFileCategory(f.name).id === 'presentations') },
                  { id: 'images', title: '🖼️ Images', files: uploadedFiles.filter(f => getFileCategory(f.name).id === 'images') },
                  { id: 'other', title: '📎 Other', files: uploadedFiles.filter(f => getFileCategory(f.name).id === 'other') }
                ].filter(g => g.files.length > 0).map(group => (
                  <div key={group.id} className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">{group.title}</h4>
                    <div className="space-y-4">
                      {group.files.map((file) => {
                        const idx = uploadedFiles.findIndex(f => f.id === file.id);
                        const srvId = file.serviceId || selectedService;
                        const fileCopies = file.copies || copies;
                        const rateObj = SERVICES.find(s => s.id === srvId) || SERVICES[0];
                        const pages = file.pageCount || 1;
                        let cost = pages * rateObj.rate * fileCopies;
                        if (file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour') {
                          const bwRate = SERVICES.find(s => s.id === 'bw-single')?.rate || 1.0;
                          const colourRate = SERVICES.find(s => s.id === 'colour')?.rate || 6.80;
                          const mode = file.printMode || 'hybrid';
                          if (mode === 'all-color') cost = pages * colourRate * fileCopies;
                          else if (mode === 'all-bw') cost = pages * bwRate * fileCopies;
                          else cost = ((file.bwPages * bwRate) + (file.colorPages * colourRate)) * fileCopies;
                        }
                        
                        return (
                          <div
                            key={file.id}
                            className="relative z-10 p-4 rounded-xl liquid-glass-sub text-white flex flex-col gap-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                                  <span className="text-xl">{getFileCategory(file.name).icon}</span>
                                </div>
                                <div className="truncate flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-xs text-white truncate max-w-[200px] sm:max-w-xs" title={file.name}>
                                      {file.name}
                                    </h5>
                                    {file.isAnalyzing ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying PDF...
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
                                        <FileCheck2 className="w-3 h-3 text-cyan-400" /> {file.pageCount || 1} {file.pageCount === 1 ? 'Page' : 'Pages'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>{formatFileSize(file.size)}</span>
                                    {file.colorPages !== undefined && file.bwPages !== undefined && (
                                      <span className="text-cyan-300 font-medium">
                                        • {file.colorPages > 0 ? `${file.bwPages} B&W, ${file.colorPages} Color` : '100% Monochrome'}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors shrink-0"
                                title="Remove file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                                  <span>Pages to Print</span>
                                  <span className="text-cyan-400 text-[9px] font-normal">Detected: {file.pageCount || 1}</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="9999"
                                  value={file.pageCount || 1}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    const updated = [...uploadedFiles];
                                    updated[idx].pageCount = val; 
                                    if (updated[idx].colorPages !== undefined) {
                                      updated[idx].colorPages = Math.min(updated[idx].colorPages!, val);
                                      updated[idx].bwPages = val - updated[idx].colorPages!;
                                    } else if (updated[idx].bwPages !== undefined) {
                                      updated[idx].bwPages = val;
                                    }
                                    setUploadedFiles(updated);
                                  }}
                                  className="mt-1 block w-full text-xs rounded-xl liquid-glass-input text-white p-2 font-bold"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Print Service</label>
                                <select
                                  value={srvId}
                                  onChange={(e) => {
                                    const newFiles = [...uploadedFiles];
                                    newFiles[idx].serviceId = e.target.value as PrintServiceId;
                                    setUploadedFiles(newFiles);
                                  }}
                                  className="mt-1 block w-full text-xs rounded-xl liquid-glass-input text-white p-2"
                                >
                                  {SERVICES.map(s => <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.title} (₹{s.rate.toFixed(2)}/{s.unit})</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Copies</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="999"
                                  value={fileCopies}
                                  onChange={(e) => {
                                    const newFiles = [...uploadedFiles];
                                    newFiles[idx].copies = parseInt(e.target.value) || 1;
                                    setUploadedFiles(newFiles);
                                  }}
                                  className="mt-1 block w-full text-xs rounded-xl liquid-glass-input text-white p-2"
                                />
                              </div>
                            </div>
                            
                            {file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour' && (
                              <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/40 border border-cyan-500/30 text-white">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">🎨</span>
                                    <span className="font-bold text-xs">PDF Document Analysis</span>
                                  </div>
                                  <div className="text-xs font-bold bg-cyan-900/40 px-2.5 py-1 rounded-full text-cyan-300 border border-cyan-500/30">
                                    {file.pageCount || 1} Total Pages
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-emerald-500/20">
                                    <div className="text-emerald-400 font-bold text-xs mb-1">Color Pages: {file.colorPages || 0}</div>
                                    <div className="text-[10px] text-slate-400 font-mono h-20 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                                      {file.colorPageList && file.colorPageList.length > 0 ? (
                                        file.colorPageList.map(p => <div key={p}>Page {p}</div>)
                                      ) : (
                                        <div className="opacity-50 italic">None (0 color pages)</div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-500/20">
                                    <div className="text-slate-300 font-bold text-xs mb-1">Black & White Pages: {file.bwPages || file.pageCount || 1}</div>
                                    <div className="text-[10px] text-slate-400 font-mono h-20 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                                      {Array.from({length: file.pageCount || 1}, (_, i) => i + 1)
                                        .filter(p => !(file.colorPageList || []).includes(p))
                                        .map(p => <div key={p}>Page {p}</div>)}
                                    </div>
                                  </div>
                                </div>

                                {/* Option to Print Smart Hybrid vs Full Colour */}
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFiles = [...uploadedFiles];
                                      newFiles[idx].printMode = 'hybrid';
                                      setUploadedFiles(newFiles);
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                                      (file.printMode || 'hybrid') === 'hybrid'
                                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20'
                                        : 'border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Smart Hybrid (Save ₹)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newFiles = [...uploadedFiles];
                                      newFiles[idx].printMode = 'all-color';
                                      setUploadedFiles(newFiles);
                                    }}
                                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                                      file.printMode === 'all-color'
                                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-sm shadow-cyan-500/20'
                                        : 'border-white/10 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Print All in Colour
                                  </button>
                                </div>
                              </div>
                            )}

                            {file.colorPages !== undefined && file.bwPages !== undefined && srvId !== 'colour' && file.colorPages > 0 && (
                              <div className="p-3 rounded-xl bg-slate-900/50 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 font-bold">ℹ️ Color Detected:</span>
                                  <span className="text-slate-300">
                                    Contains {file.colorPages} colour page(s) out of {file.pageCount} total pages.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFiles = [...uploadedFiles];
                                    newFiles[idx].serviceId = 'colour';
                                    newFiles[idx].printMode = 'hybrid';
                                    setUploadedFiles(newFiles);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-[11px] font-bold transition-all shrink-0 self-start sm:self-auto"
                                >
                                  Switch to Colour (Smart Hybrid)
                                </button>
                              </div>
                            )}

                            {file.colorPages !== undefined && file.colorPages === 0 && (
                              <div className="p-2 rounded-xl bg-slate-900/30 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400">
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  True page count verified: {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} (100% Monochrome)
                                </span>
                                <span className="text-slate-400 text-[10px]">PDF Engine Verified</span>
                              </div>
                            )}
                            
                            <div className="mt-1 pt-3 border-t border-slate-700/50 flex justify-between items-center bg-cyan-950/20 p-2 rounded-lg">
                              <span className="text-[11px] font-medium text-slate-300">
                                {(file.colorPages !== undefined && file.bwPages !== undefined && srvId === 'colour' && (!file.printMode || file.printMode === 'hybrid')) ? (
                                  <>Smart Hybrid: {file.bwPages} B&W × ₹{(SERVICES.find(s => s.id === 'bw-single')?.rate || 1.0).toFixed(2)} + {file.colorPages} Colour × ₹{rateObj.rate.toFixed(2)}{fileCopies > 1 ? ` (× ${fileCopies} copies)` : ''}</>
                                ) : (
                                  <>{pages} {rateObj.unit}{pages > 1 ? 's' : ''} × ₹{rateObj.rate.toFixed(2)} × {fileCopies} {fileCopies === 1 ? 'copy' : 'copies'}</>
                                )}
                              </span>
                              <span className="text-sm font-bold text-cyan-400">
                                ₹{cost.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-4 py-3 rounded-xl border border-dashed border-blue-400/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Document</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Print Specifications & Finishing Options */}
          <div className="relative rounded-3xl p-6 liquid-glass overflow-hidden text-white space-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 mb-2">
              <span className="text-xl">⚙️</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Print Options &amp; Finishing
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Number of Copies */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Number of Copies *
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-10 h-10 rounded-l-xl bg-slate-800 border border-slate-700 font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center h-10 border-y border-slate-700 bg-slate-800/50 text-white font-bold text-sm focus:outline-none focus:bg-slate-800 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-10 h-10 rounded-r-xl bg-slate-800 border border-slate-700 font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Page Range */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Page Range
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="e.g. All, or 1-5, 8, 11-14"
                  className="w-full h-10 px-3.5 liquid-glass-input text-white rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Paper Size */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Paper Size
                </label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="w-full h-10 px-3 liquid-glass-input text-white rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 transition-all"
                >
                  <option value="A4" className="bg-slate-900">Standard A4 (Most Common)</option>
                  <option value="A3" className="bg-slate-900">Large A3 (Diagrams &amp; Blueprints)</option>
                  <option value="Legal" className="bg-slate-900">Legal Paper (8.5 × 14 in)</option>
                </select>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Orientation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('Portrait')}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'Portrait'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900/30 border-white/15 text-slate-300 hover:text-white'
                    }`}
                  >
                    Portrait 📄
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('Landscape')}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'Landscape'
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900/30 border-white/15 text-slate-300 hover:text-white'
                    }`}
                  >
                    Landscape 📑
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Student Details & Real-Time Bill (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile & Delivery Details */}
          <div className="relative rounded-3xl p-6 liquid-glass overflow-hidden text-white space-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 mb-1">
              <span className="text-xl">👤</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Student &amp; Pickup Info
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Pre-filled from your active account profile.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Student Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="relative z-10 w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                placeholder="+91 1234567890"
                className="relative z-10 w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Pickup Point / Campus Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. MPM PRINTER Shop Counter or Hostel Room"
                className="relative z-10 w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Special Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Page 1-3 color, rest B&W / Urgent submission today at 3 PM"
                className="relative z-10 w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Real-time Order Summary & Price Breakdown */}
          <div className="relative rounded-3xl p-6 liquid-glass overflow-hidden text-white space-y-4">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-emerald-500/10 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 mb-2">
              <span className="text-xl">🧾</span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Estimated Bill Summary
              </h3>
            </div>

            <div className="relative z-10 space-y-3 text-xs text-white bg-slate-900/30 border border-white/10 rounded-2xl p-4">
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Documents:</span>
                    <strong className="text-white">{uploadedFiles.filter(f => getFileCategory(f.name).id === 'documents').length} file(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Spreadsheets:</span>
                    <strong className="text-white">{uploadedFiles.filter(f => getFileCategory(f.name).id === 'spreadsheets').length} file(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Presentations:</span>
                    <strong className="text-white">{uploadedFiles.filter(f => getFileCategory(f.name).id === 'presentations').length} file(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Images:</span>
                    <strong className="text-white">{uploadedFiles.filter(f => getFileCategory(f.name).id === 'images').length} file(s)</strong>
                  </div>
                  
                  <div className="border-t border-slate-700/60 my-2 pt-2"></div>
                  
                  <div className="flex justify-between">
                    <span>Total Files:</span>
                    <strong className="text-white">{uploadedFiles.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Printed Pages:</span>
                    <strong className="text-white">
                      {totalPages}
                    </strong>
                  </div>
                  
                  {billSplit.hasHybrid ? (
                    <>
                      <div className="border-t border-slate-700/60 my-2 pt-2"></div>
                      {billSplit.colorCount > 0 && (
                        <div className="flex justify-between text-cyan-300">
                          <span>Colour Pages ({billSplit.colorCount} × ₹{billSplit.colourRate.toFixed(2)}):</span>
                          <strong className="text-white">₹{billSplit.colorTotal.toFixed(2)}</strong>
                        </div>
                      )}
                      {billSplit.bwCount > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>B&W Pages ({billSplit.bwCount} × ₹{billSplit.bwRate.toFixed(2)}):</span>
                          <strong className="text-white">₹{billSplit.bwTotal.toFixed(2)}</strong>
                        </div>
                      )}
                      {billSplit.otherCost > 0 && (
                        <div className="flex justify-between text-purple-300">
                          <span>Other Services:</span>
                          <strong className="text-white">₹{billSplit.otherCost.toFixed(2)}</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>Price Per Page (Avg):</span>
                      <strong className="text-white">
                        ₹{(grandTotal / Math.max(1, totalPages)).toFixed(2)}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Default Print Type:</span>
                    <strong className="text-white">{activeRate.title}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Default Unit Rate:</span>
                    <span>₹{activeRate.rate.toFixed(2)} / {activeRate.unit}</span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-700/80 my-3"></div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Final Total:</span>
                <span className="text-3xl font-extrabold bg-gradient-to-r from-[#00f0ff] to-[#00e676] bg-clip-text text-transparent font-fredoka">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <SwipeToOrderButton
                onConfirm={handlePlaceOrder}
                disabled={isSubmitting || uploadedFiles.length === 0}
                isLoading={isSubmitting}
              />
            </div>

            {/* Direct WhatsApp Assistance */}
            <div className="relative z-10 mt-4 pt-4 border-t border-white/10 text-center">
              <a
                href="https://wa.me/919443071443"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Urgent query? WhatsApp shop at +91 94430 71443</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ORDER PLACED SUCCESS MODAL */}
      {/* ========================================================= */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="font-fredoka text-2xl font-bold text-slate-900 dark:text-white">
              Order Registered!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Your print request has been saved to your account and sent to MPM PRINTER.
            </p>

            <div className="my-5 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Order ID:</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  #{orderSuccessModal.orderId}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Student:</span>
                <strong className="text-slate-800 dark:text-slate-200">{orderSuccessModal.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Service:</span>
                <span>{orderSuccessModal.serviceTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">₹{orderSuccessModal.totalPrice.toFixed(2)}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={generateWhatsAppShareUrl(orderSuccessModal)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Confirmation on WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setOrderSuccessModal(null);
                  setActiveTab('orders');
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs"
              >
                Track Status in My Orders
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {isLaunching && (
        <RocketLaunchOverlay 
          onComplete={() => {
            setIsLaunching(false);
            setUploadedFiles([]);
            setActiveTab('orders');
          }} 
        />
      )}
    </>
  );
};
