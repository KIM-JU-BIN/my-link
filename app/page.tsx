"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { db, auth, googleProvider } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore"
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { Header } from "@/components/header"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  nickname: string;
  bio: string;
  profileImageUrl: string;
  createdAt: string;
}

const dummyUser: UserProfile = {
  id: "google_uid_123456789",
  email: "user@example.com",
  displayName: "Candy Kim",
  username: "김주빈",
  nickname: "candykim",
  bio: "풀스택을 공부하며 향후 DBA를 희망하는 학생",
  profileImageUrl: "/avatar.jpg",
  createdAt: "2026-03-23T10:00:00.000Z"
};
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { IconPlus, IconLoader2 as Loader2, IconPencil, IconTrash, IconBrandGoogle, IconLink, IconArrowRight, IconEye, IconGlobe } from "@tabler/icons-react"
import { z } from "zod"
import { useForm, FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

const linkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력해주세요"),
  url: z
    .string()
    .trim()
    .min(1, "주소를 입력해주세요")
    .transform((val) => {
      let formatted = val
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`
      }
      return formatted
    })
    .refine(
      (val) => {
        try {
          const parsedUrl = new URL(val)
          const hostnameParts = parsedUrl.hostname.split(".")
          return hostnameParts.length >= 2 && hostnameParts[hostnameParts.length - 1].length >= 2
        } catch {
          return false
        }
      },
      {
        message: "올바른 URL 형식이 아닙니다 (예: https://example.com).",
      }
    ),
})

type LinkFormValues = z.infer<typeof linkSchema>

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "이름을 입력해주세요"),
  displayName: z
    .string()
    .trim()
    .min(3, "디스플레이 네임은 최소 3자 이상이어야 합니다.")
    .max(16, "디스플레이 네임은 최대 16자 이하이어야 합니다.")
    .regex(/^[a-z0-9_]+$/, "영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다."),
  bio: z
    .string()
    .trim()
    .max(150, "한 줄 소개는 최대 150자 이하이어야 합니다."),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface LinkCardProps {
  link: LinkItem;
  onUpdate: (id: string, title: string, url: string, faviconUrl: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function LinkCard({ link, onUpdate, onDelete }: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: link.title,
      url: link.url,
    },
  })

  useEffect(() => {
    reset({
      title: link.title,
      url: link.url,
    })
  }, [link, reset, isEditing])

  const handleEditSubmit = async (data: LinkFormValues) => {
    setIsSubmitting(true)
    let domain = ""
    try {
      const urlObj = new URL(data.url)
      domain = urlObj.hostname
    } catch (err) {
      domain = data.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
    }
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

    try {
      await onUpdate(link.id, data.title, data.url, faviconUrl)
      setIsEditing(false)
    } catch (err) {
      console.error("수정 오류: ", err)
      toast.error("링크 수정에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await onDelete(link.id)
      setIsAlertOpen(false)
    } catch (err) {
      console.error("삭제 오류: ", err)
      toast.error("링크 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <Card className="bg-slate-900 border-slate-800 rounded-none w-full p-6 shadow-2xl text-slate-200">
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-title-${link.id}`} className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              제목
            </Label>
            <Input
              id={`edit-title-${link.id}`}
              type="text"
              placeholder="예: 내 기술 블로그"
              {...register("title")}
              disabled={isSubmitting}
              className="h-10 rounded-none border border-slate-800 bg-slate-950/80 px-3 font-mono text-xs focus-visible:border-slate-600 focus-visible:ring-0 placeholder:text-slate-700 text-slate-200 w-full"
            />
            {errors.title && (
              <p className="text-[10px] text-red-400 font-mono tracking-wider mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-url-${link.id}`} className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              링크 URL
            </Label>
            <Input
              id={`edit-url-${link.id}`}
              type="text"
              placeholder="예: blog.example.com"
              {...register("url")}
              disabled={isSubmitting}
              className="h-10 rounded-none border border-slate-800 bg-slate-950/80 px-3 font-mono text-xs focus-visible:border-slate-600 focus-visible:ring-0 placeholder:text-slate-700 text-slate-200 w-full"
            />
            {errors.url && (
              <p className="text-[10px] text-red-400 font-mono tracking-wider mt-1">
                {errors.url.message}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                reset()
                setIsEditing(false)
              }}
              className="rounded-none font-mono text-xs tracking-wider border border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-white h-9 px-4 cursor-pointer"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <Card className="relative hover:border-slate-700 bg-slate-900/40 backdrop-blur-md transition-all duration-200 shadow-2xl border-slate-800/60 rounded-none overflow-hidden w-full text-slate-200">
      <div className="flex items-center justify-between min-h-[72px] px-6 py-4">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 flex-1 cursor-pointer select-none py-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800/80 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={link.faviconUrl} 
              alt={link.title}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://www.google.com/s2/favicons?domain=example.com";
              }}
            />
          </div>
          
          <span className="text-sm font-semibold tracking-wider font-mono text-slate-300 hover:text-cyan-400 transition-colors duration-150 text-left break-all line-clamp-2 pr-2">
            {link.title}
          </span>
        </a>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="h-8 w-8 rounded-none border border-slate-800/60 hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0"
            title="수정"
          >
            <IconPencil className="w-4 h-4" />
          </Button>

          <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogTrigger render={
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsAlertOpen(true)
                }}
                className="h-8 w-8 rounded-none border border-slate-800/60 hover:bg-red-950/30 text-slate-500 hover:text-red-400 transition-colors cursor-pointer p-0"
                title="삭제"
              >
                <IconTrash className="w-4 h-4" />
              </Button>
            } />
            <AlertDialogContent className="max-w-md rounded-none border border-slate-800 bg-slate-900 p-6 shadow-2xl font-mono text-xs text-slate-200">
              <AlertDialogHeader className="gap-2 text-left">
                <AlertDialogTitle className="text-base font-bold tracking-wider text-white font-mono">
                  정말 삭제하시겠습니까?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-400 font-mono tracking-wider mt-2">
                  "<span className="font-bold text-slate-200">{link.title}</span>" 링크를 삭제합니다.
                  <span className="block mt-2 font-semibold text-red-400">
                    이 작업은 되돌릴 수 없습니다.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-4 flex flex-row gap-2 justify-end">
                <AlertDialogCancel 
                  disabled={isDeleting}
                  className="rounded-none font-mono text-xs tracking-wider border border-slate-700 !bg-slate-950/50 !text-slate-300 hover:!bg-slate-800 hover:!border-slate-500 hover:!text-white h-9 px-4 cursor-pointer"
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction 
                  disabled={isDeleting}
                  variant="destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteConfirm()
                  }}
                  className="rounded-none font-mono text-xs tracking-wider h-9 px-4 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "삭제하기"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${isVisible ? "active" : ""} ${className}`}
    >
      {children}
    </div>
  )
}

function LandingPage({ onSignIn }: { onSignIn: () => Promise<void> }) {
  return (
    <div className="w-full flex flex-col items-center bg-slate-950 text-slate-100 select-none">
      {/* 1. 히어로 섹션 */}
      <section className="w-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-20 relative bg-grid-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-3xl flex flex-col items-center">
          <span className="px-3 py-1 text-[11px] font-semibold font-mono tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 rounded-full mb-6 uppercase animate-pulse">
            Next-Gen Developer Hub
          </span>
          <h1 className="text-center font-sans font-black tracking-tight text-white leading-none select-none">
            <span className="block text-4xl sm:text-[64px] mb-3 sm:mb-5">Development in</span>
            <span className="block text-5xl sm:text-[76px] bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(34,211,238,0.15)] pb-1">
              One Link.
            </span>
          </h1>

          <p className="text-center text-slate-400 font-sans font-medium text-sm sm:text-base tracking-wide mt-8 leading-relaxed max-w-lg select-none">
            GitHub, 포트폴리오, 개인 블로그까지.<br />
            나를 대표하는 모든 연결고리를 한 곳에 담아 공유하세요.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 w-full max-w-sm mx-auto">
            {/* 극도로 강조된 제작자 샘플 페이지 구경하기 버튼 (캡슐형) */}
            <a
              href="/b22615014"
              className="w-full inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 via-pink-600 to-orange-500 hover:from-violet-500 hover:via-pink-500 hover:to-orange-400 text-white font-sans text-xs sm:text-sm font-black tracking-wider transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.6)] cursor-pointer select-none no-underline decoration-none group animate-pulse-glow"
            >
              <IconEye className="w-4 h-4 sm:w-5 sm:h-5 text-violet-100 shrink-0" />
              <span>제작자 샘플 페이지 구경하기</span>
              <IconArrowRight className="w-4 h-4 text-violet-200 transition-transform duration-300 group-hover:translate-x-1 shrink-0" />
            </a>

            {/* 대표색(Cyan) 기반으로 강조된 Google로 시작하기 버튼 (캡슐형) */}
            <Button
              onClick={onSignIn}
              className="w-full h-12 sm:h-[50px] bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-sans text-xs sm:text-sm font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer border-0 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] transition-all duration-300 px-6"
            >
              <IconBrandGoogle className="w-4 h-4" />
              <span>Google로 시작하기</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 섹션 1: "순식간에 완성되는 링크 편집" */}
      <section className="w-full py-24 sm:py-32 px-6 flex justify-center items-center bg-slate-950 relative border-t border-slate-900/50">
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-cyan-900/5 blur-[100px] pointer-events-none" />
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <ScrollReveal className="flex flex-col text-left">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-3">
              Easy Management
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              순식간에 완성되는<br />링크 편집
            </h2>
            <p className="text-sm sm:text-base text-slate-400 tracking-wide mt-6 leading-relaxed">
              복잡한 입력 양식이나 절차는 필요 없습니다. 제목과 주소만 적어 넣으면 즉시 프로필에 추가됩니다. 언제든 편리하게 수정하고, 나를 가장 잘 보여주는 방식으로 리스트를 정렬하세요.
            </p>
          </ScrollReveal>
          
          <ScrollReveal className="flex justify-center">
            {/* 가상 편집 UI 카드 (Glassmorphism) */}
            <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-2xl flex flex-col gap-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800/40">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-[10px] text-slate-500 font-mono ml-2">Edit Links</span>
              </div>
              
              <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <span className="text-xs text-cyan-400 font-bold">G</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-bold">내 개발 깃허브 (GitHub)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-slate-300 cursor-pointer">
                    <IconPencil className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-red-400 cursor-pointer">
                    <IconTrash className="w-3 h-3" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-xl flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <span className="text-xs text-cyan-400 font-bold">B</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 font-bold">기술 및 일상 블로그</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-slate-300 cursor-pointer">
                    <IconPencil className="w-3 h-3" />
                  </div>
                  <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center border border-slate-800 text-slate-500 hover:text-red-400 cursor-pointer">
                    <IconTrash className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* 새 링크 입력 시뮬레이션 */}
              <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-xl flex flex-col gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] relative">
                <span className="absolute top-2 right-2 text-[8px] font-mono bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">Active</span>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 font-mono">제목</span>
                  <span className="text-xs text-slate-300 font-mono">나의 포트폴리오 사이트</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 font-mono">URL</span>
                  <span className="text-xs text-cyan-400 font-mono">portfolio.dev</span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 3. 섹션 2: "독자적인 원링크(One Link) 허브" */}
      <section className="w-full py-24 sm:py-32 px-6 flex justify-center items-center bg-slate-950 relative border-t border-slate-900/50">
        <div className="absolute top-[30%] left-[-10%] w-[35%] h-[35%] rounded-full bg-purple-900/5 blur-[100px] pointer-events-none" />
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <ScrollReveal className="flex justify-center order-2 md:order-1">
            {/* 네트워크 맵 그래픽 */}
            <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-slate-950/20" />
              
              {/* 메인 주소 창 */}
              <div className="relative z-10 px-4 py-2.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] sm:text-xs font-mono text-cyan-400 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] mb-12">
                <IconGlobe className="w-3.5 h-3.5" />
                <span>mylink.com/username</span>
              </div>
              
              {/* 네트워크 선 (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                {/* 선들 */}
                <path d="M 224 135 L 120 230" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 224 135 L 224 230" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 224 135 L 328 230" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>

              {/* 3가지 소셜 노드 */}
              <div className="flex gap-10 sm:gap-14 relative z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:scale-110 transition-transform duration-200">
                    <span className="text-xs font-bold text-cyan-400">Git</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">GitHub</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-purple-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.1)] hover:scale-110 transition-transform duration-200">
                    <span className="text-xs font-bold text-purple-400">Blog</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Blog</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.1)] hover:scale-110 transition-transform duration-200">
                    <span className="text-xs font-bold text-rose-400">Mail</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Contact</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="flex flex-col text-left order-1 md:order-2">
            <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase mb-3">
              Unified URL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              독자적인 원링크<br />(One Link) 허브
            </h2>
            <p className="text-sm sm:text-base text-slate-400 tracking-wide mt-6 leading-relaxed">
              여러 채널에 파편화된 다양한 커리어 기록들을 `mylink.com/username` 단 하나의 깔끔한 주소로 담아내세요. 이력서, SNS, 포트폴리오 등에 이 스마트한 한 줄의 연결 링크를 기재하는 것만으로 충분합니다.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 4. 섹션 3: "실시간 클릭 모니터링" */}
      <section className="w-full py-24 sm:py-32 px-6 flex justify-center items-center bg-slate-950 relative border-t border-slate-900/50">
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-cyan-900/5 blur-[100px] pointer-events-none" />
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <ScrollReveal className="flex flex-col text-left">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-3">
              Analytics
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              실시간 클릭<br />모니터링
            </h2>
            <p className="text-sm sm:text-base text-slate-400 tracking-wide mt-6 leading-relaxed">
              등록한 링크 중 사람들에게 가장 관심 있는 영역이 어디인지 직관적으로 파악해 보세요. 실시간 방문 수 및 클릭 통계 분석 리포트를 제공하여 여러분의 커리어 성장을 돕고 관심을 시각화합니다.
            </p>
          </ScrollReveal>
          
          <ScrollReveal className="flex justify-center">
            {/* 가상 차트 및 대시보드 UI (Glassmorphism) */}
            <div className="relative w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-slate-800/60 p-6 rounded-2xl shadow-2xl flex flex-col gap-5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                <span className="text-xs font-bold font-mono text-slate-400">Weekly Insights</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Real-Time</span>
              </div>
              
              {/* 주요 요약 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono block">총 방문자 수</span>
                  <span className="text-base sm:text-lg font-bold text-white font-mono mt-1 block">1,248</span>
                  <span className="text-[9px] text-emerald-500 font-mono mt-0.5 block font-semibold">+14.2% 이번주</span>
                </div>
                <div className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-mono block">총 링크 클릭 수</span>
                  <span className="text-base sm:text-lg font-bold text-white font-mono mt-1 block">856</span>
                  <span className="text-[9px] text-cyan-400 font-mono mt-0.5 block font-semibold">+8.5% 이번주</span>
                </div>
              </div>

              {/* 통계 그래프 일러스트 (CSS) */}
              <div className="bg-slate-950/60 border border-slate-800/40 p-4 rounded-xl flex flex-col gap-3">
                <span className="text-[9px] text-slate-500 font-mono">가장 클릭이 많은 링크</span>
                
                <div className="flex flex-col gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>GitHub</span>
                      <span>420 clicks (49%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full w-[49%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Tech Blog</span>
                      <span>310 clicks (36%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full w-[36%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. 섹션 4: "지금, 당신의 링크를 설계하세요" (CTA) */}
      <section className="w-full py-28 sm:py-36 px-6 flex flex-col justify-center items-center bg-slate-950 relative border-t border-slate-900/50">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-950/10 via-transparent to-transparent pointer-events-none" />
        
        <ScrollReveal className="w-full max-w-2xl text-center flex flex-col items-center z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight select-none">
            지금, 당신의 링크를<br />설계하세요
          </h2>
          <p className="text-sm sm:text-base text-slate-400 tracking-wide mt-6 leading-relaxed max-w-md select-none">
            단 1분이면 나만을 위한 링크 허브가 완성됩니다.<br />
            무료로 시작하고 편리하게 당신의 성과를 알려보세요.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 w-full max-w-sm mx-auto">
            {/* 대표색(Cyan) 기반으로 강조된 Google로 시작하기 버튼 (캡슐형) */}
            <Button
              onClick={onSignIn}
              className="w-full h-12 sm:h-[50px] bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-sans text-xs sm:text-sm font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer border-0 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] transition-all duration-300 px-6"
            >
              <IconBrandGoogle className="w-4 h-4" />
              <span>Google로 시작하기</span>
            </Button>
          </div>
        </ScrollReveal>
      </section>

      {/* 하단 카피라이트 */}
      <footer className="w-full text-center py-12 text-[10px] text-slate-600 font-sans tracking-widest border-t border-slate-900/50 bg-slate-950 select-none z-10">
        © 2026 MyLink. All rights reserved.
      </footer>
    </div>
  )
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)

  const queryClient = useQueryClient()

  // 1. 프로필 정보 조회 Query
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile", user?.uid],
    queryFn: async () => {
      if (!user) return null
      const userDocRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userDocRef)
      const nickname = user.email ? user.email.split("@")[0] : "user"
      
      if (userSnap.exists()) {
        const existData = userSnap.data()
        return {
          username: existData.username || user.displayName || "사용자",
          displayName: existData.displayName || nickname,
          bio: existData.bio || "한 줄 소개를 입력해주세요.",
          photoURL: existData.photoURL || user.photoURL || "",
        }
      }

      let profileData = {
        uid: user.uid,
        email: user.email || "",
        displayName: nickname,
        username: user.displayName || "사용자",
        photoURL: user.photoURL || "",
        bio: "한 줄 소개를 입력해주세요.",
        lastLoginAt: new Date().toISOString(),
      }
      await setDoc(userDocRef, profileData, { merge: true })
      return {
        username: profileData.username,
        displayName: profileData.displayName,
        bio: profileData.bio,
        photoURL: profileData.photoURL,
      }
    },
    enabled: !!user,
  })

  // 2. 링크 목록 조회 Query
  const { data: links = [], isLoading: isLinksLoading } = useQuery({
    queryKey: ["links", user?.uid],
    queryFn: async () => {
      if (!user) return []
      const q = query(collection(db, "users", user.uid, "links"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        url: doc.data().url,
        faviconUrl: doc.data().faviconUrl,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt || undefined,
      })) as LinkItem[]
    },
    enabled: !!user,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  })

  // 프로필 인라인 수정 상태 관리 (displayName은 수정 불가 — 유일성 보장)
  const [editingField, setEditingField] = useState<"username" | "bio" | null>(null)
  const [tempUsername, setTempUsername] = useState("")
  const [tempBio, setTempBio] = useState("")

  // Firebase Auth 상태 리스너 등록
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsAuthLoading(false)
      if (!currentUser) {
        queryClient.clear()
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error("구글 소셜 로그인 에러: ", err)
      toast.error("구글 로그인에 실패했습니다.")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("로그아웃 에러: ", err)
      toast.error("로그아웃에 실패했습니다.")
    }
  }

  // 3. 링크 추가 Mutation
  const addLinkMutation = useMutation({
    mutationFn: async (newLinkData: { title: string; url: string; faviconUrl: string; createdAt: string }) => {
      if (!user) throw new Error("로그인이 필요합니다.")
      return await addDoc(collection(db, "users", user.uid, "links"), newLinkData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
      setIsOpen(false)
      reset()
    },
    onError: (err) => {
      console.error("링크 저장 실패: ", err)
      toast.error("링크 추가에 실패했습니다.")
    }
  })

  const handleAddLink = async (data: LinkFormValues) => {
    if (!user) return
    let domain = ""
    try {
      const urlObj = new URL(data.url)
      domain = urlObj.hostname
    } catch (err) {
      domain = data.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

    const newLinkData = {
      title: data.title,
      url: data.url,
      faviconUrl,
      createdAt: new Date().toISOString(),
    }

    addLinkMutation.mutate(newLinkData)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
    }
  }

  // 4. 프로필 저장 Mutation (낙관적 업데이트 적용)
  const saveProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<UserProfile>) => {
      if (!user) throw new Error("로그인이 필요합니다.")
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, updatedData)
      return updatedData
    },
    onMutate: async (newProfileFields) => {
      await queryClient.cancelQueries({ queryKey: ["profile", user?.uid] })
      const previousProfile = queryClient.getQueryData(["profile", user?.uid])
      queryClient.setQueryData(["profile", user?.uid], (old: any) => {
        if (!old) return old
        return {
          ...old,
          ...newProfileFields,
        }
      })
      return { previousProfile }
    },
    onError: (err, newProfileFields, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile", user?.uid], context.previousProfile)
      }
      toast.error("프로필 수정에 실패했습니다.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] })
    },
    onSuccess: () => {
      toast.success("수정되었습니다.")
      setEditingField(null)
    }
  })

  // displayName은 최초 계정 생성 시 1회만 설정되며 이후 수정 불가 (Security Rules 레벨에서 차단)

  // 5. 링크 수정 Mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({ id, title, url, faviconUrl }: { id: string; title: string; url: string; faviconUrl: string }) => {
      if (!user) throw new Error("로그인이 필요합니다.")
      const linkRef = doc(db, "users", user.uid, "links", id)
      const updatedAt = new Date().toISOString()
      return await updateDoc(linkRef, { title, url, faviconUrl, updatedAt })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
    },
    onError: (err) => {
      console.error("링크 수정 실패: ", err)
      throw err
    }
  })

  const handleUpdateLink = async (id: string, title: string, url: string, faviconUrl: string) => {
    await updateLinkMutation.mutateAsync({ id, title, url, faviconUrl })
  }

  // 6. 링크 삭제 Mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("로그인이 필요합니다.")
      const linkRef = doc(db, "users", user.uid, "links", id)
      return await deleteDoc(linkRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", user?.uid] })
    },
    onError: (err) => {
      console.error("링크 삭제 실패: ", err)
      throw err
    }
  })

  const handleDeleteLink = async (id: string) => {
    await deleteLinkMutation.mutateAsync(id)
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-svh w-full bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-100">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          <span className="text-[10px] text-slate-500 tracking-widest uppercase">인증 데이터 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-svh w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden font-sans relative">
        {/* 네온 배경 광원 효과 */}
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-950/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-950/10 blur-[120px] pointer-events-none" />

        <Header user={user} profileDisplayName={profile?.displayName} profilePhotoURL={profile?.photoURL} onSignIn={handleSignIn} onSignOut={handleSignOut} isDark={true} />

        <LandingPage onSignIn={handleSignIn} />
      </div>
    )
  }

  return (
    <div className="min-h-svh w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden font-mono relative">
      {/* 네온 배경 광원 효과 */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-5%] w-[45%] h-[45%] rounded-full bg-purple-950/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-cyan-950/10 blur-[120px] pointer-events-none" />

      <Header user={user} profileDisplayName={profile?.displayName} profilePhotoURL={profile?.photoURL} onSignIn={handleSignIn} onSignOut={handleSignOut} isDark={true} />

      <div className="w-full max-w-md flex flex-col items-center gap-10 px-4 py-16 flex-1 justify-start relative z-10">
        {/* 프로필 섹션 */}
        <div className="relative flex flex-col items-center text-center gap-2 w-full mt-4 animate-fade-in">
          {/* 프로필 이미지 (사진 편집은 제거) */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200/80 shadow-xs mb-3 bg-slate-100 shrink-0">
            {profile?.photoURL || user.photoURL ? (
              <Image
                src={profile?.photoURL || user.photoURL || ""}
                alt={profile?.username || user.displayName || "UserProfile"}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cyan-50 text-cyan-600 font-mono text-xl font-bold">
                {(profile?.username || user.displayName || "U").charAt(0)}
              </div>
            )}
          </div>

          {/* 이름 (username) 인라인 편집 */}
          {editingField === "username" ? (
            <div className="flex items-center justify-center min-h-[32px] w-full">
              <Input
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const target = tempUsername.trim()
                    if (!target) {
                      toast.error("이름을 입력해주세요.")
                      return
                    }
                    saveProfileMutation.mutate({ username: target })
                  } else if (e.key === "Escape") {
                    setEditingField(null)
                  }
                }}
                autoFocus
                onBlur={() => {
                  const target = tempUsername.trim()
                  if (target && target !== (profile?.username || "")) {
                    saveProfileMutation.mutate({ username: target })
                  } else {
                    setEditingField(null)
                  }
                }}
                disabled={saveProfileMutation.isPending}
                className="max-w-[200px] h-8 text-center font-sans font-bold text-xl border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-none bg-slate-900 text-white py-0"
              />
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempUsername(profile?.username || "")
                setEditingField("username")
              }}
              className="group relative flex items-center justify-center min-h-[32px] w-full cursor-pointer select-none"
            >
              <div className="relative flex items-center">
                <h1 className="text-xl font-bold tracking-wider text-white font-sans group-hover:text-cyan-400 transition-colors">
                  {profile?.username || user.displayName || "사용자"}
                </h1>
                <IconPencil className="absolute left-full ml-2 w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0" />
              </div>
            </div>
          )}

          {/* 닉네임 (displayName) — 읽기 전용 (최초 설정 후 수정 불가) */}
          <div className="flex items-center justify-center min-h-[24px] w-full">
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              @{profile?.displayName || user.email?.split("@")[0] || "user"}
            </p>
          </div>

          {/* 한 줄 소개 (bio) 인라인 편집 */}
          {editingField === "bio" ? (
            <div className="flex items-center justify-center min-h-[36px] w-full max-w-[320px]">
              <Input
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    saveProfileMutation.mutate({ bio: tempBio.trim() })
                  } else if (e.key === "Escape") {
                    setEditingField(null)
                  }
                }}
                autoFocus
                onBlur={() => {
                  if (tempBio.trim() !== (profile?.bio || "")) {
                    saveProfileMutation.mutate({ bio: tempBio.trim() })
                  } else {
                    setEditingField(null)
                  }
                }}
                disabled={saveProfileMutation.isPending}
                className="w-full h-9 text-center font-mono text-xs border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-none bg-slate-900 text-white px-3"
                placeholder="한 줄 소개를 입력해주세요."
              />
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempBio(profile?.bio || "")
                setEditingField("bio")
              }}
              className="group relative flex items-center justify-center min-h-[28px] mt-2 w-full px-8 cursor-pointer select-none"
            >
              <div className="relative flex items-center max-w-[280px]">
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed tracking-wider whitespace-pre-line text-center group-hover:text-cyan-400 transition-colors">
                  {profile?.bio || "한 줄 소개를 입력해주세요."}
                </p>
                <IconPencil className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0" />
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-4 animate-fade-in">
          {/* 링크 추가 다이얼로그 */}
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger render={
              <Button 
                disabled={addLinkMutation.isPending}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white rounded-none font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-0 shadow-xs">
                {addLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconPlus className="w-4 h-4" />
                )}
                {addLinkMutation.isPending ? "추가 중..." : "새 링크 추가"}
              </Button>
            } />
            <DialogContent className="max-w-md rounded-none border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-base font-bold tracking-wider font-mono text-white">
                  새 링크 추가
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-mono tracking-wider">
                  프로필에 표시할 새 링크의 제목과 URL 주소를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(handleAddLink)} className="space-y-4 my-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                    제목
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="예: 내 기술 블로그"
                    {...register("title")}
                    disabled={addLinkMutation.isPending}
                    className="h-10 rounded-none border border-slate-800 bg-slate-950/80 px-3 font-mono text-xs focus-visible:border-slate-600 focus-visible:ring-0 placeholder:text-slate-700 text-slate-200"
                  />
                  {errors.title && (
                    <p className="text-[10px] text-red-400 font-mono tracking-wider mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                    링크 URL
                  </Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="예: blog.example.com"
                    {...register("url")}
                    disabled={addLinkMutation.isPending}
                    className="h-10 rounded-none border border-slate-800 bg-slate-950/80 px-3 font-mono text-xs focus-visible:border-slate-600 focus-visible:ring-0 placeholder:text-slate-700 text-slate-200"
                  />
                  {errors.url && (
                    <p className="text-[10px] text-red-400 font-mono tracking-wider mt-1">
                      {errors.url.message}
                    </p>
                  )}
                </div>

                <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
                  <Button
                    type="button"
                    disabled={addLinkMutation.isPending}
                    onClick={() => {
                      reset()
                      setIsOpen(false)
                    }}
                    className="rounded-none font-mono text-xs tracking-wider border border-slate-700 bg-slate-950/50 text-slate-300 hover:bg-slate-800 hover:border-slate-500 hover:text-white h-9 px-4 cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={addLinkMutation.isPending}
                    className="rounded-none bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {addLinkMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>저장 중...</span>
                      </>
                    ) : (
                      "저장"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* 기존 및 추가된 링크 목록 */}
          {isLinksLoading ? (
            <div className="w-full flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : links.length === 0 ? (
            <div className="w-full text-center py-12 border border-dashed border-slate-800 bg-slate-900/20 text-slate-500 font-mono text-xs tracking-wider">
              아직 등록된 링크가 없어요.
              <span className="block mt-1 text-[10px] text-slate-600">첫 번째 링크를 추가해 링크 허브를 완성하세요!</span>
            </div>
          ) : (
            links.map((link) => (
              <LinkCard 
                key={link.id} 
                link={link}
                onUpdate={handleUpdateLink}
                onDelete={handleDeleteLink}
              />
            ))
          )}
        </div>
        
        {/* 하단 카피라이트 */}
        <footer className="w-full text-center pt-16 pb-4 text-[10px] text-slate-400 font-sans tracking-widest select-none">
          © 2026 MyLink. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

