import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Link } from 'wouter';
import { getGetComplaintQueryKey, getListComplaintsQueryKey, useGetSetupStatus, useListComplaints, useUpdateComplaintStatus } from '@/lib/api-client-react';
import { categories, departmentNames, statusLabels } from '@/lib/app-data';
import { queryClient } from '@/lib/query-client';
import { DepartmentName, InlineError, LoadingPage, Metric, PageTitle, SetupNotice, StatusPill, UploadPhoto } from '@/components/app-shared';
import { Activity, ArrowRight, CheckCircle2, ClipboardList, Landmark, Search, X } from 'lucide-react';
export function DepartmentWork({
  profile
}) {
  const setup = useGetSetupStatus();
  const workDepartment = profile?.department;
  const params = workDepartment ? {
    department: workDepartment
  } : {};
  const list = useListComplaints(params, {
    query: {
      enabled: setup.data?.ready === true,
      queryKey: getListComplaintsQueryKey(params)
    }
  });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const statusMutation = useUpdateComplaintStatus();
  const [note, setNote] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const visible = (list.data || []).filter(c => c.status === 'assigned' || c.status === 'in_progress').filter(c => `${c.publicId} ${c.description} ${c.address}`.toLowerCase().includes(search.toLowerCase()));
  const updateStatus = status => {
    if (!selected) return;
    statusMutation.mutate({
      id: selected.id,
      data: {
        status,
        note: note.trim() || (status === 'resolved' ? 'Work completed by the department team.' : 'Work has started.'),
        ...(status === 'resolved' && resolutionPhoto ? {
          resolutionPhotoUrl: resolutionPhoto
        } : {})
      }
    }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListComplaintsQueryKey(params)
        });
        void queryClient.invalidateQueries({
          queryKey: getGetComplaintQueryKey(selected.id)
        });
        setSelected(null);
        setNote('');
        setResolutionPhoto('');
      }
    });
  };
  return _jsxs(_Fragment, {
    children: [_jsx(SetupNotice, {}), _jsx("div", {
      className: "mt-6",
      children: _jsx(PageTitle, {
        eyebrow: "Department workspace",
        title: "Work assigned to your team.",
        text: "Keep residents in the loop as work moves forward.",
        actions: _jsx("span", {
          className: "rounded-full bg-[#e3ece2] px-3 py-2 text-[11px] font-bold text-[#426858]",
          children: _jsx(DepartmentName, {
            value: profile?.department
          })
        })
      })
    }), selected && _jsx("div", {
      className: "fixed inset-0 z-50 flex items-center justify-center bg-[#173d37]/35 p-4",
      children: _jsxs("div", {
        className: "card w-full max-w-lg p-6 shadow-2xl",
        onClick: e => e.stopPropagation(),
        children: [_jsxs("div", {
          className: "flex items-start justify-between",
          children: [_jsxs("div", {
            children: [_jsx("div", {
              className: "text-[10px] font-bold uppercase tracking-wider text-[#a56b42]",
              children: selected.publicId
            }), _jsx("h3", {
              className: "mt-1 font-display text-xl font-extrabold",
              children: "Update this report"
            }), _jsx("p", {
              className: "mt-2 text-xs subtle",
              children: selected.address
            })]
          }), _jsx("button", {
            "aria-label": "Close",
            onClick: () => setSelected(null),
            children: _jsx(X, {
              size: 19
            })
          })]
        }), _jsx("textarea", {
          className: "field mt-5 min-h-[90px]",
          maxLength: 500,
          value: note,
          onChange: e => setNote(e.target.value),
          placeholder: "Add a note for the resident (optional)",
          "data-testid": "input-department-note"
        }), _jsx("div", {
          className: "mt-4",
          children: _jsx(UploadPhoto, {
            purpose: "resolution",
            value: resolutionPhoto,
            onUploaded: setResolutionPhoto
          })
        }), _jsxs("div", {
          className: "mt-4 flex flex-wrap justify-end gap-2",
          children: [_jsxs("button", {
            disabled: statusMutation.isPending,
            className: "btn btn-quiet",
            onClick: () => updateStatus('in_progress'),
            children: [_jsx(Activity, {
              size: 15
            }), " Mark in progress"]
          }), _jsxs("button", {
            disabled: statusMutation.isPending || !resolutionPhoto,
            className: "btn btn-primary",
            onClick: () => updateStatus('resolved'),
            children: [_jsx(CheckCircle2, {
              size: 15
            }), " Mark resolved"]
          })]
        }), statusMutation.isError && _jsx("p", {
          className: "mt-3 text-xs text-destructive",
          children: "Update failed. Please try again."
        })]
      })
    }), _jsxs("div", {
      className: "mb-5 grid gap-3 sm:grid-cols-3",
      children: [_jsx(Metric, {
        label: "Assigned",
        value: setup.data?.ready ? visible.filter(c => c.status === 'assigned').length : '—',
        icon: ClipboardList,
        caption: "Ready to begin"
      }), _jsx(Metric, {
        label: "In progress",
        value: setup.data?.ready ? visible.filter(c => c.status === 'in_progress').length : '—',
        icon: Activity,
        caption: "Your team is on it"
      }), _jsx(Metric, {
        label: "Department",
        value: workDepartment ? departmentNames[workDepartment].split(' ')[0] : '—',
        icon: Landmark,
        caption: workDepartment ? departmentNames[workDepartment] : 'Ask an administrator to assign a team'
      })]
    }), !profile?.department && _jsx("div", {
      className: "mb-4 rounded-xl border border-[#e7d2ac] bg-[#fff5df] p-4 text-xs text-[#725122]",
      children: "Your staff profile does not yet have a department assigned. Ask an administrator to set your team before taking action."
    }), _jsxs("div", {
      className: "card p-4",
      children: [_jsxs("div", {
        className: "mb-4 flex flex-wrap items-center justify-between gap-3",
        children: [_jsxs("div", {
          children: [_jsx("h2", {
            className: "font-display text-lg font-extrabold",
            children: "Active work"
          }), _jsx("p", {
            className: "mt-1 text-xs subtle",
            children: "Only reports currently assigned or in progress are shown."
          })]
        }), _jsxs("div", {
          className: "relative",
          children: [_jsx(Search, {
            size: 15,
            className: "absolute left-3 top-3 text-[#849188]"
          }), _jsx("input", {
            className: "field !w-[220px] !py-2 !pl-9 !text-xs",
            placeholder: "Search reports",
            value: search,
            onChange: e => setSearch(e.target.value),
            "data-testid": "input-department-search"
          })]
        })]
      }), list.isLoading ? _jsx(LoadingPage, {}) : list.isError ? _jsx(InlineError, {
        text: "Assigned work could not be loaded.",
        retry: () => list.refetch()
      }) : !setup.data?.ready ? null : visible.length === 0 ? _jsxs("div", {
        className: "rounded-xl bg-[#f3f3e9] p-10 text-center",
        children: [_jsx("div", {
          className: "mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#e5ece2] text-primary",
          children: _jsx(CheckCircle2, {
            size: 20
          })
        }), _jsx("div", {
          className: "mt-3 text-sm font-bold",
          children: "No active reports to work on"
        }), _jsx("p", {
          className: "mt-1 text-xs subtle",
          children: "New assignments will appear here."
        })]
      }) : _jsx("div", {
        className: "divide-y divide-[#e6e4d9]",
        children: visible.map(c => _jsxs("div", {
          className: "flex flex-wrap items-center gap-3 py-4",
          children: [_jsxs("div", {
            className: "min-w-0 flex-1",
            children: [_jsxs("div", {
              className: "text-[10px] font-bold uppercase tracking-wider text-[#a16b44]",
              children: [c.publicId, " \u00B7 ", categories.find(x => x.value === c.category)?.label]
            }), _jsx("div", {
              className: "mt-1 truncate text-sm font-bold text-[#2d5046]",
              children: c.address
            }), _jsx("div", {
              className: "mt-1 line-clamp-1 text-xs subtle",
              children: c.description
            })]
          }), _jsx(StatusPill, {
            status: c.status
          }), _jsxs("button", {
            onClick: () => setSelected(c),
            className: "btn btn-quiet !px-3 !py-2 text-xs",
            "data-testid": `button-update-${c.id}`,
            children: ["Update ", _jsx(ArrowRight, {
              size: 13
            })]
          }), _jsx(Link, {
            href: `/complaints/${c.id}`,
            className: "rounded-lg p-2 text-[#7b8b81] hover:bg-[#eef0e7]",
            "aria-label": "Open report",
            children: _jsx(ArrowRight, {
              size: 16
            })
          })]
        }, c.id))
      })]
    })]
  });
}
