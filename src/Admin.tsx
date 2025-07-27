import { useEffect, useState, useCallback, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  type ICellRendererParams,
  type ColDef,
  type GridReadyEvent,
  type CellClickedEvent,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";
import { FiEdit2, FiTrash2, FiSend } from "react-icons/fi";
import { MdQrCode } from "react-icons/md";
import { Html5Qrcode } from "html5-qrcode";
import QRCode from "react-qr-code";
import { supabase } from "./supabaseClient";
import {
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  QrCodeIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { ImportIcon } from "lucide-react";
import { useSearchParams } from 'react-router-dom';

ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_WEDDING_ID = "931d5a18-9bce-40ab-9717-6a117766ff44";
const API_URL = "https://rest.trip-nus.com";
// const API_URL = "http://localhost:3000";

type Guest = {
  id: string;
  full_name: string;
  nickname?: string;
  address?: string;
  phone_number?: string;
  invitation_link?: string;
  is_attending?: boolean | null;
  num_attendees?: number;
  wish?: string;
  photo_url?: string;
  additional_names?: string[];
  wedding_id?: string;
  rsvp_at?: string; // ISO date string
  created_at?: string; // ISO date string
  updated_at?: string; // ISO date string
  tag?: string;
  num_attendees_confirmed?: number;
  attendance_confirmed?: boolean | null;
  invited_by?: string;
};

type QRScannerProps = {
  onResult: (result: string) => void;
  setShowScanner: (value: boolean) => void;
};

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function QRScanner({ onResult, setShowScanner }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scannerId = "qr-scanner-element";

    const startScanner = async () => {
      if (scannerRef.current) return;

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onResult(decodedText);
            handleClose();
          },
          (errorMessage) => {
            console.warn("QR scan error:", errorMessage);
          }
        );
      } catch (err) {
        console.error("Scanner start failed", err);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
        } catch (err) {
          console.error("Scanner stop failed", err);
        }
      }
    };

    const handleClose = async () => {
      await stopScanner();
      setShowScanner(false);
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [onResult, setShowScanner]);

  const handleClose = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Scanner stop failed", err);
      }
    }
    setShowScanner(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-3xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-600 z-50"
      >
        ×
      </button>

      {/* QR Scanner Container */}
      <div id="qr-scanner-element" className="w-full" />
    </div>
  );
}

function QRCodeModal({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onDoubleClick={onClose}
    >
      <div
        className="relative bg-white p-6 rounded-lg shadow-lg flex flex-col items-center"
        onDoubleClick={(e) => e.stopPropagation()} // Prevent double-click inside from closing
      >
        <button
          className="absolute top-2 right-4 text-xl text-gray-600 hover:text-red-600"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-lg mb-4 font-semibold">QR Code</h2>
        <QRCode value={id} size={256} />
        <p className="mt-4 text-sm text-gray-500 break-all">{id}</p>
      </div>
    </div>
  );
}

export default function GuestAdmin() {
  const [searchParams] = useSearchParams();
  const invitedBy = searchParams.get('invited_by');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [rowData, setRowData] = useState<Guest[]>([]);
  const [formData, setFormData] = useState<Partial<Guest>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [additionalNamesInput, setAdditionalNamesInput] = useState(
    formData.additional_names?.join(", ") || ""
  );
  const [showSummary, setShowSummary] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRows, setFilteredRows] = useState<Guest[] | null>(null);
  const [showInvalidQRModal, setShowInvalidQRModal] = useState(false);
  const [successGuest, setSuccessGuest] = useState<{
    full_name: string;
    additional_names?: string[];
  } | null>(null);

  const [qrId, setQrId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchGuests = useCallback(async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams({
      wedding_id: DEFAULT_WEDDING_ID,
      limit: "1000",
    });

    if (invitedBy) {
      const formattedInvitedBy = invitedBy.replace(/-/g, " - ");
      queryParams.set("invited_by", formattedInvitedBy);
    }

    const res = await fetch(`${API_URL}/guests?${queryParams.toString()}`);
    const response = await res.json();

    let guests = response.data || [];
    guests = guests.sort((a: Guest, b: Guest) =>
      (a.nickname || "").toLowerCase().localeCompare((b.nickname || "").toLowerCase())
    );

    setRowData(guests);
  } catch (err) {
    console.error("Error fetching guests", err);
  } finally {
    setLoading(false);
  }
}, [invitedBy]); // <-- Don't forget to include invitedBy in deps!

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure to delete this guest?")) return;
    try {
      await fetch(`${API_URL}/guests/${id}`, {
        method: "DELETE",
      });
      fetchGuests();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleEdit = (data: Guest) => {
    setEditingId(data.id || null);
    setFormData({
      full_name: data.full_name,
      nickname: data.nickname,
      address: data.address,
      phone_number: data.phone_number,
      is_attending: data.is_attending,
      num_attendees: data.num_attendees,
      additional_names: data.additional_names,
      tag: data.tag,
      attendance_confirmed: data.attendance_confirmed,
      invited_by: data.invited_by,
    });
    setAdditionalNamesInput(data.additional_names?.join(", ") || "");
    dialogRef.current?.showModal();
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ num_attendees: 2 });
    setAdditionalNamesInput("");
    dialogRef.current?.showModal();
  };

  const handleSubmit = async () => {
    // Title case helper
    function toTitleCase(str: string): string {
      return str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    const payload = {
      ...formData,
      full_name: formData.full_name ? toTitleCase(formData.full_name) : null,
      additional_names: formData.additional_names
        ? formData.additional_names.map(toTitleCase)
        : null,
      nickname: formData.nickname ? toTitleCase(formData.nickname) : null,
      address: formData.address ? toTitleCase(formData.address) : null,
      wish: formData.wish ? toTitleCase(formData.wish) : null,
      tag: formData.tag ? toTitleCase(formData.tag) : null,
      wedding_id: DEFAULT_WEDDING_ID,
    };

    try {
      if (editingId) {
        await fetch(`${API_URL}/guests/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_URL}/guests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      dialogRef.current?.close();
      setFormData({});
      setEditingId(null);
      fetchGuests();
    } catch (err) {
      console.error("Submit failed", err);
    }
  };

  const handleResult = async (result: string) => {
    try {
      const response = await fetch(`${API_URL}/guests/${result}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result,
          attendance_confirmed: true,
        }),
      });

      if (!response.ok) {
        setShowInvalidQRModal(true);
        return;
      }

      // Find the guest locally in rowData
      const guest = rowData.find((g) => g.id === result);
      console.log(guest);
      if (guest) {
        setSuccessGuest({
          full_name: guest.full_name,
          additional_names: guest.additional_names || [],
        });
      }

      fetchGuests(); // Refresh data
    } catch (error) {
      console.error("Error handling QR result:", error);
      setShowInvalidQRModal(true);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    }
  };

  const handleImport = async () => {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      alert('Contact Picker API not supported on this browser.');
      return;
    }

    const available = await (navigator.contacts as any).getProperties?.();
    const props = ['name', 'tel', 'address'].filter((p) => available?.includes(p) ?? true);

    const contacts = await (navigator.contacts as any).select(props, { multiple: false });
    if (!contacts?.length) return;

    const contact = contacts[0];

    // Get full name
    const fullName = contact.name?.[0] ?? '';

    // Format phone number
    let rawPhone = contact.tel?.[0] ?? '';
    let cleanedPhone = rawPhone
      .replace(/[\s()+-]/g, '')  // Remove space, (, ), +, -
      .replace(/^62/, '0');     // Replace starting 62 with 0

    setFormData({
      ...formData,
      full_name: fullName,
      nickname: fullName,
      phone_number: cleanedPhone,
      address: contact.address?.[0]?.streetAddress ?? '',
    });

    dialogRef.current?.showModal();
  } catch (err) {
    console.error('Contact picker error:', err);
  }
};

  const columnDefs: ColDef<Guest>[] = [
    {
      headerName: "Actions",
      width: 160,
      minWidth: 130,
      cellRenderer: (params: ICellRendererParams<Guest>) => {
        if (!params.data) return null;

        const waMessage = `Halo Bapak/Ibu ${params.data.full_name} 👋

Kami mengundang dengan hormat ke acara pernikahan kami:

💍 Finna & Hary  
📅 Sabtu, 07 Februari 2026  
📍 ASTON Bogor Hotel & Resort  
🕒 18.00 - 21.00 WIB

Undangan digital dapat dibuka melalui link berikut:  
👉 http://hary-finna.trip-nus.com/?to=${params.data.id}

Kami sangat berharap kehadiran Bapak/Ibu untuk berbagi kebahagiaan bersama kami.  

Mohon konfirmasi kehadiran melalui link di atas ya.

Terima kasih banyak 🙏  

Salam hangat,  
Finna & Hary`;

        let phoneNumber = params.data.phone_number?.replace(/\D/g, "") || "";
        if (phoneNumber.startsWith("0")) {
          phoneNumber = "62" + phoneNumber.slice(1);
        }
        const waUrl = phoneNumber
          ? `https://wa.me/${phoneNumber}?text=${encodeURIComponent(waMessage)}`
          : `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: "100%",
            }}
          >
            {/* Edit button */}
            <button
              className="btn-edit"
              data-id={params.data.id}
              title="Edit"
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#2563eb")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#3b82f6")}
              onClick={() => params.data && handleEdit(params.data)}
            >
              <FiEdit2 size={18} />
            </button>

            {/* Delete button */}
            <button
              className="btn-delete"
              data-id={params.data.id}
              title="Delete"
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#b91c1c")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
              onClick={() => params.data?.id && handleDelete(params.data.id)}
            >
              <FiTrash2 size={18} />
            </button>

            {/* WhatsApp send button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Send WhatsApp"
              style={{
                background: "#22c55e",
                color: "white",
                border: "none",
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                textDecoration: "none",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#15803d")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#22c55e")}
            >
              <FiSend size={18} />
            </a>
          </div>
        );
      },
    },
    {
      field: "invited_by",
      headerName: "Invited By",
      width: 130,
      minWidth: 80,
      valueFormatter: (params) =>
        params.value == null || params.value === "" ? "—" : params.value,
    },
    { field: "nickname", headerName: "Nickname", width: 120, minWidth: 150 },
    {
      field: "full_name",
      headerName: "Full Name",
      width: 150,
      minWidth: 180,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        return params.value;
      },
    },
    {
      field: "additional_names",
      headerName: "Additional Names",
      width: 180,
      minWidth: 150,
      valueFormatter: (params) => {
        if (
          !params.value ||
          (Array.isArray(params.value) && params.value.length === 0)
        )
          return "—";

        let value = params.value;

        try {
          if (typeof value === "string") {
            value = JSON.parse(value);
          }

          if (Array.isArray(value) && value.length > 0) {
            const names = value.map((name) => toTitleCase(String(name)));
            return names.join(", ");
          }
        } catch {
          return "Invalid data";
        }

        return "—";
      },
    },
    {
      field: "is_attending",
      headerName: "RSVP Status",
      width: 120,
      minWidth: 100,
      cellRenderer: "agTextCellRenderer",
      valueFormatter: (params) =>
        params.value === true
          ? "✅ Yes"
          : params.value === false
          ? "❌ No"
          : "—",
    },
    {
      field: "attendance_confirmed",
      headerName: "Attendance Confirmed",
      width: 120,
      minWidth: 100,
      cellRenderer: "agTextCellRenderer",
      valueFormatter: (params) =>
        params.value === true
          ? "✅ Yes"
          : params.value === false
          ? "❌ No"
          : "—",
    },
    {
      field: "num_attendees",
      headerName: "#",
      width: 100,
      minWidth: 80,
      valueFormatter: (params) =>
        params.value == null || params.value === "" ? "—" : params.value,
    },
    {
      field: "num_attendees_confirmed",
      headerName: "# Confirmed",
      width: 100,
      minWidth: 80,
      valueFormatter: (params) =>
        params.value == null || params.value === "" ? "—" : params.value,
    },
    {
      field: "address",
      headerName: "Address",
      width: 200,
      minWidth: 180,
      valueFormatter: (params) => (!params.value ? "—" : params.value),
    },
    {
      field: "phone_number",
      headerName: "Phone",
      width: 130,
      minWidth: 180,
      valueFormatter: (params) => (!params.value ? "—" : params.value),
    },
    {
      field: "tag",
      headerName: "Tag",
      width: 100,
      minWidth: 100,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        return params.value;
      },
    },
    {
      field: "wish",
      headerName: "Wish",
      width: 250,
      minWidth: 200,
      valueFormatter: (params) => (!params.value ? "—" : params.value),
    },
    {
      field: "photo_url",
      headerName: "Photo URL",
      width: 150,
      minWidth: 80,
      cellRenderer: (params: ICellRendererParams<string>) => {
        if (!params.value) return "—";
        return (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Open Photo
          </a>
        );
      },
    },
    {
      field: "invitation_link", // You can keep this or change it to "id"
      headerName: "Invitation Link",
      width: 200,
      minWidth: 180,
      cellRenderer: (params: ICellRendererParams<Guest>) => {
        const id = params.data?.id;
        if (!id) return "—";

        const url = `http://hary-finna.trip-nus.com/?to=${id}`;

        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            Open Link
          </a>
        );
      },
    },
    {
      headerName: "QR",
      width: 80,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
      cellRenderer: (params: ICellRendererParams<Guest>) => {
        if (!params.data) return null;
        return (
          <button
            title="Show QR Code"
            style={{
              color: "black",
              border: "none",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => {
              setQrId(params.data!.id);
              setShowQR(true);
            }}
          >
            <MdQrCode size={18} />
          </button>
        );
      },
    },
    {
      field: "rsvp_at",
      headerName: "RSVP Date",
      width: 180,
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        return new Date(params.value).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      },
    },
    {
      field: "created_at",
      headerName: "Created",
      width: 180,
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        return new Date(params.value).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      },
    },
    {
      field: "updated_at",
      headerName: "Updated",
      width: 180,
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return "—";
        return new Date(params.value).toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      },
    },
  ];

  const onGridReady = (params: GridReadyEvent) => {
    params.api.addEventListener("cellClicked", (event: CellClickedEvent) => {
      const target = event.event?.target as HTMLElement;
      if (!target) return;

      if (target.classList.contains("btn-edit")) {
        const id = target.getAttribute("data-id");
        const guest = rowData.find((g) => g.id === id);
        if (guest) handleEdit(guest);
      }
      if (target.classList.contains("btn-delete")) {
        const id = target.getAttribute("data-id");
        if (id) handleDelete(id);
      }
    });
  };

  // Calculate summary stats for Finna and Hary
  const summary = ["Finna", "Hary"].map((tag) => {
    const guests = rowData.filter((row) => row.tag === tag);
    const guestCount = guests.length;

    const attendeeCount = guests.reduce(
      (sum, row) =>
        sum + (typeof row.num_attendees === "number" ? row.num_attendees : 0),
      0
    );

    const attendanceConfirmedCount = guests.reduce(
      (sum, row) => sum + (row.attendance_confirmed ? 1 : 0),
      0
    );

    const isAttendingCount = guests.reduce(
      (sum, row) => sum + (row.is_attending ? 1 : 0),
      0
    );

    return {
      tag,
      guestCount,
      attendeeCount,
      attendanceConfirmedCount,
      isAttendingCount,
    };
  });

  return (
    <div
      className="p-4"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100vw",
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold hidden md:block">Guest Management</h2>
        <div className="grid grid-cols-10 gap-2 w-full md:flex md:gap-2 md:items-center md:w-auto">
          <div className="relative col-span-10 md:col-span-1">
            <input
              type="text"
              className="border px-2 py-1 rounded pr-8 w-full h-10"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const term = e.target.value.trim().toLowerCase();
                if (!term) {
                  setFilteredRows(null);
                  return;
                }
                setFilteredRows(
                  rowData.filter((row) => {
                    const fullName = row.full_name?.toLowerCase() || "";
                    const nickname = row.nickname?.toLowerCase() || "";
                    const additionalNames = Array.isArray(row.additional_names)
                      ? row.additional_names
                          .map((n) => n.toLowerCase())
                          .join(" ")
                      : "";
                    return (
                      fullName.includes(term) ||
                      nickname.includes(term) ||
                      additionalNames.includes(term)
                    );
                  })
                );
              }}
              style={{ minWidth: 120 }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilteredRows(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full"
                tabIndex={-1}
                aria-label="Clear search"
              >
                &#10005;
              </button>
            )}
          </div>
          <button
            onClick={() => handleLogout()}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 
            bg-red-500 hover:bg-red-600 text-white 
            px-4 py-2 rounded border border-red-600 
            w-full md:w-auto active:scale-95 transition-transform duration-100"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="hidden md:inline">Log Out</span>
          </button>

          <button
            onClick={() => setShowSummary(true)}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 border border-gray-300 w-full md:w-auto active:scale-95 transition-transform duration-100"
          >
            <ChartBarIcon className="h-5 w-5" />
            <span className="hidden md:inline">Summary</span>
          </button>

          <button
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 border border-gray-300 w-full md:w-auto active:scale-95 transition-transform duration-100"
            onClick={() => setShowScanner((prev) => !prev)}
          >
            <QrCodeIcon className="h-5 w-5" />
            <span className="hidden md:inline">Scan QR</span>
          </button>

          <button
            onClick={handleImport}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto active:scale-95 transition-transform duration-100"
          >
            <ImportIcon className="h-5 w-5" />
            <span className="hidden md:inline">Import Contact</span>
          </button>

          <button
            onClick={handleAdd}
            className="col-span-2 md:col-span-1 flex items-center justify-center gap-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto active:scale-95 transition-transform duration-100"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span className="hidden md:inline">Add Guest</span>
          </button>
        </div>
      </div>
      {/* Summary Modal */}
      {showSummary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10"
          onDoubleClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSummary(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-2 border border-black">
            <h3 className="text-lg font-bold mb-4 text-center">Summary</h3>
            <div className="flex flex-col gap-2 text-base font-medium">
              {/* Guests */}
              {summary.map((s) => (
                <div key={s.tag + "-guests"} className="flex justify-between">
                  <span>{s.tag} Guests:</span>
                  <span>{s.guestCount}</span>
                </div>
              ))}

              <hr className="my-2 border-gray-300" />

              {/* Attendees */}
              {summary.map((s) => (
                <div
                  key={s.tag + "-attendees"}
                  className="flex justify-between"
                >
                  <span>{s.tag} Attendees:</span>
                  <span>{s.attendeeCount}</span>
                </div>
              ))}

              <hr className="my-2 border-gray-300" />

              {/* Attendance Confirmed */}
              {summary.map((s) => (
                <div key={s.tag + "-rsvp"} className="flex justify-between">
                  <span>{s.tag} RSVP Confirmed:</span>
                  <span>{s.isAttendingCount}</span>
                </div>
              ))}

              <hr className="my-2 border-gray-300" />

              {/* Attendance Confirmed */}
              {summary.map((s) => (
                <div
                  key={s.tag + "-attendance"}
                  className="flex justify-between"
                >
                  <span>{s.tag} Attendance Confirmed:</span>
                  <span>{s.attendanceConfirmedCount}</span>
                </div>
              ))}

              {/* Total Row */}
              <hr className="my-2 border-black" />
              <div className="flex justify-between font-bold">
                <span>Total Attendance Confirmed:</span>
                <span>
                  {summary.reduce(
                    (total, s) => total + s.attendanceConfirmedCount,
                    0
                  )}
                </span>
              </div>
            </div>

            <button
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              onClick={() => setShowSummary(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <div
          className="ag-theme-alpine"
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            minHeight: 0,
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full text-gray-600 text-lg">
              Loading guests...
            </div>
          ) : (
            <AgGridReact
              theme="legacy"
              rowData={filteredRows ?? rowData}
              columnDefs={columnDefs}
              defaultColDef={{
                resizable: true,
                sortable: true,
                filter: true,
              }}
              animateRows
              onGridReady={onGridReady}
              suppressColumnVirtualisation={false}
              suppressRowVirtualisation={false}
              onCellDoubleClicked={(params) => {
                if (params.data) {
                  handleEdit(params.data);
                }
              }}
            />
          )}
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onResult={(result) => {
            handleResult(result);
          }}
          setShowScanner={setShowScanner}
        />
      )}

      {showQR && qrId && (
        <QRCodeModal id={qrId} onClose={() => setShowQR(false)} />
      )}

      {/* Invalid QR Modal */}
      {showInvalidQRModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-2">Invalid QR Code</h2>
            <p className="text-gray-700 mb-4">No matching guest was found.</p>
            <button
              onClick={() => setShowInvalidQRModal(false)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success QR Modal */}
      {successGuest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center animate-fadeIn">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">
              Attendance Confirmed
            </h2>
            <p className="text-gray-800 font-medium">
              {successGuest.full_name}
            </p>
            {successGuest!.additional_names!.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-500 mb-1">With:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 text-left inline-block">
                  {successGuest!.additional_names!.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setSuccessGuest(null)}
              className="mt-6 bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-auto rounded-lg p-6  shadow-lg border bg-white"
        onDoubleClick={(e) => {
          if (e.target === e.currentTarget) {
            dialogRef.current?.close();
            setFormData({});
            setEditingId(null);
            setAdditionalNamesInput("");
          }
        }}
      >
        <form
          method="dialog"
          className="flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()} // Prevent form clicks from bubbling to dialog
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <h3 className="text-xl font-semibold mb-2">
            {editingId ? "Edit Guest" : "Add Guest"}
          </h3>
          <div className="flex gap-6 items-center mb-2">
            <span className="text-gray-700 w-40">
              Attendees: <span className="text-red-500">*</span>
            </span>
            {[1, 2, 3, 4].map((num) => (
              <label key={num} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="num_attendees"
                  value={num}
                  checked={formData.num_attendees === num}
                  onChange={() =>
                    setFormData({ ...formData, num_attendees: num })
                  }
                />
                {num}
              </label>
            ))}
          </div>
          {/* Tag (radio) */}
          <div className="flex gap-6 items-center mb-2 justify-start">
            <span className="text-gray-700 w-40">
              Tag: <span className="text-red-500">*</span>
            </span>
            {["Finna", "Hary"].map((tag) => (
              <label key={tag} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="tag"
                  value={tag}
                  checked={formData.tag === tag}
                  onChange={() => setFormData({ ...formData, tag })}
                />
                {tag}
              </label>
            ))}
          </div>
          <div className="flex flex-col">
            <label className="mb-1 font-medium">Invited By</label>
            <select
              className={`p-2 rounded h-12 w-full border border-black ${
                !formData.invited_by ? "text-gray-500" : "text-black"
              }`}
              value={formData.invited_by || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  invited_by: value,
                });
              }}
            >
              <option value="" disabled>
                Invited By *
              </option>
              <option value="Finna">Finna</option>
              <option value="Finna - Papa">Finna - Papa</option>
              <option value="Finna - Mama">Finna - Mama</option>
              <option value="Hary">Hary</option>
              <option value="Hary - Mama">Hary - Mama</option>
              <option value="Hary - Koko">Hary - Koko</option>
            </select>
          </div>

          <div className="flex flex-col">
            {editingId && <label className="mb-1 font-medium">Nickname</label>}
            <input
              className="border p-2 rounded"
              placeholder="Nickname *"
              value={formData.nickname || ""}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              required
            />
          </div>
          <div className="flex flex-col">
            {editingId && <label className="mb-1 font-medium">Full Name</label>}
            <input
              className="border p-2 rounded"
              placeholder="Full Name"
              value={formData.full_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col">
            {editingId && (
              <label className="mb-1 font-medium">Additional Names</label>
            )}
            <input
              className="border p-2 rounded"
              placeholder="Additional Names (comma separated)"
              value={additionalNamesInput}
              onChange={(e) => {
                const value = e.target.value;
                setAdditionalNamesInput(value);
                setFormData({
                  ...formData,
                  additional_names: value
                    .split(",")
                    .map((name) => name.trim())
                    .filter(Boolean),
                });
              }}
            />
          </div>
          <div className="flex flex-col">
            {editingId && <label className="mb-1 font-medium">Address</label>}
            <input
              className="border p-2 rounded"
              placeholder="Address"
              value={formData.address || ""}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>
          <div className="flex flex-col">
            {editingId && (
              <label className="mb-1 font-medium">Phone Number</label>
            )}
            <input
              className="border p-2 rounded"
              placeholder="Phone Number"
              value={formData.phone_number || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
            />
          </div>
          {editingId && (
            <>
              <div className="flex flex-col">
                <label className="mb-1 font-medium">RSVP Status</label>
                <select
                  className="border p-2 rounded h-12"
                  value={
                    formData.is_attending === true
                      ? "yes"
                      : formData.is_attending === false
                      ? "no"
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      is_attending:
                        value === "yes" ? true : value === "no" ? false : null,
                    });
                  }}
                >
                  <option value="">Waiting for the response</option>
                  <option value="yes">✅ Yes</option>
                  <option value="no">❌ No</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 font-medium">Attendance Confirmed</label>
                <select
                  className="border p-2 rounded h-12"
                  value={
                    formData.attendance_confirmed === true
                      ? "yes"
                      : formData.attendance_confirmed === false
                      ? "no"
                      : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      attendance_confirmed:
                        value === "yes" ? true : value === "no" ? false : null,
                    });
                  }}
                >
                  <option value="">Waiting for the response</option>
                  <option value="yes">✅ Yes</option>
                  <option value="no">❌ No</option>
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-3 mt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 rounded border"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                !formData.nickname ||
                formData.nickname.trim() === "" ||
                !formData.invited_by ||
                !formData.num_attendees ||
                !formData.tag
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={
                !formData.nickname ||
                formData.nickname.trim() === "" ||
                !formData.num_attendees ||
                !formData.tag
              }
            >
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
