"use client"


import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { IconLogout, IconCopy, IconCheck, IconEye } from "@tabler/icons-react"

interface HeaderProps {
  user: User | null;
  profileDisplayName?: string;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function Header({ user, profileDisplayName, onSignIn, onSignOut }: HeaderProps) {
  const [copied, setCopied] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleCopyLink = async () => {
    if (!user) return

    // profileDisplayName이 없으면 홈으로 fallback (존재하지 않는 /users/:uid 경로 방지)
    const path = profileDisplayName ? `/${profileDisplayName}` : `/`
    const personalUrl = `${window.location.origin}${path} ` // URL 뒤 공백 룰 준수
    try {
      await navigator.clipboard.writeText(personalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("클립보드 복사 실패:", err)
    }
  }

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* 로고 영역 (시작 화면으로 돌아가기 가능) */}
        <a href="/" className="flex items-center gap-2 select-none cursor-pointer no-underline decoration-none hover:opacity-90 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-600 font-mono text-[11px] font-black text-white shadow-[0_2px_8px_rgba(8,145,178,0.25)]">
            L
          </div>
          <span className="font-sans text-lg font-black tracking-tight">
            <span className="text-slate-800">My</span>
            <span className="text-cyan-600">Link</span>
          </span>
        </a>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {user ? (
            <>
              {/* 내 페이지 버튼 → 수정 가능한 메인 대시보드(/)로 이동 */}
              <a
                href="/"
                className="h-8 inline-flex items-center gap-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-[10px] sm:text-[11px] font-bold tracking-wider shadow-sm hover:shadow-[0_2px_8px_rgba(8,145,178,0.35)] transition-all duration-150 cursor-pointer select-none no-underline decoration-none shrink-0"
              >
                <span>내 페이지</span>
              </a>

              {/* 프로필 이미지 버튼 */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative h-9 w-9 overflow-hidden rounded-full border border-slate-200/80 shadow-2xs shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/20 active:scale-95 transition-all duration-150"
              >
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cyan-50 text-cyan-600 font-bold text-xs">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
              </button>

              {/* 드롭다운 팝오버 */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-11 z-50 w-56 bg-white border border-slate-100 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-xl font-sans text-xs flex flex-col gap-0.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  {/* 사용자 이름 및 이메일 노출 영역 */}
                  <div className="px-3 py-2 flex flex-col select-none">
                    <span className="font-semibold text-slate-800 text-[13px]">{user.displayName || "사용자"}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{user.email || ""}</span>
                  </div>

                  <div className="h-px bg-slate-100 my-1.5"></div>

                  {/* 내 페이지 미리보기 (displayName이 없으면 홈으로 fallback) */}
                  <a
                    href={profileDisplayName ? `/${profileDisplayName}` : `/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full h-9 rounded-lg px-3 text-left font-medium text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-colors duration-150 no-underline decoration-none"
                  >
                    <IconEye className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>내 페이지 미리보기</span>
                  </a>

                  {/* 링크 복사 */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full h-9 rounded-lg px-3 text-left font-medium text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-colors duration-150"
                  >
                    {copied ? (
                      <>
                        <IconCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 font-semibold">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>링크 복사</span>
                      </>
                    )}
                  </button>

                  <div className="h-px bg-slate-100 my-1.5"></div>

                  {/* 로그아웃 버튼 (붉은색 테마) */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      onSignOut()
                    }}
                    className="w-full h-9 rounded-lg px-3 text-left font-medium text-red-500 hover:bg-red-50/50 cursor-pointer flex items-center gap-2 transition-colors duration-150"
                  >
                    <IconLogout className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* 로그인 버튼 (대표색 청록색 적용) */
            <Button
              onClick={onSignIn}
              className="h-9 rounded-none bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-semibold px-4 tracking-wider cursor-pointer border-0 shadow-sm transition-all duration-200"
            >
              <span>로그인</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

