"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore"

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  createdAt: string;
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
  bio: "풀스택 개발자이자 향후 DBA를 희망하는 학생",
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
import { IconPlus, IconLoader2 as Loader2, IconPencil, IconTrash } from "@tabler/icons-react"
import { z } from "zod"
import { useForm, FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <Card className="bg-white border-slate-200 rounded-none w-full p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-title-${link.id}`} className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              제목
            </Label>
            <Input
              id={`edit-title-${link.id}`}
              type="text"
              placeholder="예: 내 기술 블로그"
              {...register("title")}
              disabled={isSubmitting}
              className="h-10 rounded-none border border-slate-200 bg-slate-50/50 px-3 font-mono text-xs focus-visible:border-slate-400 focus-visible:ring-0 placeholder:text-slate-300 w-full"
            />
            {errors.title && (
              <p className="text-[10px] text-red-500 font-mono tracking-wider mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-url-${link.id}`} className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              링크 URL
            </Label>
            <Input
              id={`edit-url-${link.id}`}
              type="text"
              placeholder="예: blog.example.com"
              {...register("url")}
              disabled={isSubmitting}
              className="h-10 rounded-none border border-slate-200 bg-slate-50/50 px-3 font-mono text-xs focus-visible:border-slate-400 focus-visible:ring-0 placeholder:text-slate-300 w-full"
            />
            {errors.url && (
              <p className="text-[10px] text-red-500 font-mono tracking-wider mt-1">
                {errors.url.message}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                reset()
                setIsEditing(false)
              }}
              className="rounded-none font-mono text-xs tracking-wider border-slate-200 text-slate-500 hover:bg-slate-50 h-9 px-4 cursor-pointer"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <Card className="relative hover:border-slate-300 bg-white transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-slate-200/80 rounded-none overflow-hidden w-full">
      <div className="flex items-center justify-between min-h-[72px] px-6 py-4">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 flex-1 cursor-pointer select-none py-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
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
          
          <span className="text-sm font-semibold tracking-wider font-mono text-slate-700 hover:text-[#1A26EE] transition-colors duration-150 text-left break-all line-clamp-2 pr-2">
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
            className="h-8 w-8 rounded-none border border-slate-200/60 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-0"
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
                className="h-8 w-8 rounded-none border border-slate-200/60 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-0"
                title="삭제"
              >
                <IconTrash className="w-4 h-4" />
              </Button>
            } />
            <AlertDialogContent className="max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-xl font-mono text-xs">
              <AlertDialogHeader className="gap-2 text-left">
                <AlertDialogTitle className="text-base font-bold tracking-wider text-slate-800 font-mono">
                  정말 삭제하시겠습니까?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-slate-500 font-mono tracking-wider mt-2">
                  삭제할 링크: <span className="font-bold text-slate-700">[{link.title}]</span>
                  <span className="block mt-2 font-semibold text-red-500">
                    이 작업은 되돌릴 수 없습니다.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-4 flex flex-row gap-2 justify-end">
                <AlertDialogCancel 
                  disabled={isDeleting}
                  className="rounded-none font-mono text-xs tracking-wider border-slate-200 text-slate-500 hover:bg-slate-50 h-9 px-4 cursor-pointer"
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction 
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteConfirm()
                  }}
                  className="rounded-none bg-red-600 hover:bg-red-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs"
                >
                  {isDeleting ? "삭제 중..." : "삭제하기"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  })

  const fetchLinks = async () => {
    setIsLoading(true)
    try {
      const q = query(collection(db, "users", "anonymous", "links"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const fetchedLinks = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        url: doc.data().url,
        faviconUrl: doc.data().faviconUrl,
        createdAt: doc.data().createdAt,
      })) as LinkItem[]
      setLinks(fetchedLinks)
    } catch (error) {
      console.error("링크 로드 에러: ", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleAddLink = async (data: LinkFormValues) => {
    setIsSubmitting(true)
    setIsOpen(false)
    reset()
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

    try {
      const docRef = await addDoc(collection(db, "users", "anonymous", "links"), newLinkData)
      const newLinkItem: LinkItem = {
        id: docRef.id,
        ...newLinkData,
      }
      setLinks((prev) => [newLinkItem, ...prev])
    } catch (err) {
      console.error("링크 저장 실패: ", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
    }
  }

  const handleUpdateLink = async (id: string, title: string, url: string, faviconUrl: string) => {
    try {
      const linkRef = doc(db, "users", "anonymous", "links", id)
      await updateDoc(linkRef, {
        title,
        url,
        faviconUrl,
      })
      setLinks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title, url, faviconUrl } : item))
      )
    } catch (err) {
      console.error("링크 수정 실패: ", err)
      throw err
    }
  }

  const handleDeleteLink = async (id: string) => {
    try {
      const linkRef = doc(db, "users", "anonymous", "links", id)
      await deleteDoc(linkRef)
      setLinks((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error("링크 삭제 실패: ", err)
      throw err
    }
  }

  return (
    <div className="min-h-svh w-full bg-[#FAFBFB] px-4 py-16 flex flex-col items-center justify-start overflow-x-hidden font-mono">
      
      <div className="w-full max-w-md flex flex-col items-center gap-10">
        
        {/* 프로필 섹션 */}
        <div className="flex flex-col items-center text-center gap-2 w-full mt-4">
          {/* 프로필 이미지 */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200/80 shadow-xs mb-3">
            <Image
              src={dummyUser.profileImageUrl}
              alt={dummyUser.username}
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
          
          {/* 이름 */}
          <h1 className="text-xl font-bold tracking-wider text-slate-800 font-mono">
            {dummyUser.displayName}
          </h1>
          {/* 닉네임 */}
          <p className="text-xs text-slate-400 font-mono tracking-wider">
            @{dummyUser.nickname}
          </p>
          {/* 한 줄 소개 */}
          <p className="text-[11px] md:text-xs text-slate-500 font-mono leading-relaxed tracking-wider max-w-[280px] mt-2 whitespace-pre-line">
            {dummyUser.bio}
          </p>
        </div>

        {/* 링크 추가 및 목록 섹션 */}
        <div className="w-full flex flex-col gap-4">
          
          {/* 링크 추가 다이얼로그 (가장 위에 배치 및 프라이머리 색상 적용) */}
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger render={
              <Button 
                disabled={isSubmitting}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-900 rounded-none font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-0 shadow-xs">
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <IconPlus className="w-4 h-4" />
                )}
                {isSubmitting ? "추가 중..." : "새 링크 추가"}
              </Button>
            } />
            <DialogContent className="max-w-md rounded-none border border-slate-200 bg-white p-6 shadow-xl">
              <DialogHeader className="gap-1">
                <DialogTitle className="text-base font-bold tracking-wider font-mono text-slate-800">
                  새 링크 추가
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 font-mono tracking-wider">
                  프로필에 표시할 새 링크의 제목과 URL 주소를 입력해주세요.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(handleAddLink)} className="space-y-4 my-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                    제목
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="예: 내 기술 블로그"
                    {...register("title")}
                    disabled={isSubmitting}
                    className="h-10 rounded-none border border-slate-200 bg-slate-50/50 px-3 font-mono text-xs focus-visible:border-slate-400 focus-visible:ring-0 placeholder:text-slate-300"
                  />
                  {errors.title && (
                    <p className="text-[10px] text-red-500 font-mono tracking-wider mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="url" className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                    링크 URL
                  </Label>
                  <Input
                    id="url"
                    type="text"
                    placeholder="예: blog.example.com"
                    {...register("url")}
                    disabled={isSubmitting}
                    className="h-10 rounded-none border border-slate-200 bg-slate-50/50 px-3 font-mono text-xs focus-visible:border-slate-400 focus-visible:ring-0 placeholder:text-slate-300"
                  />
                  {errors.url && (
                    <p className="text-[10px] text-red-500 font-mono tracking-wider mt-1">
                      {errors.url.message}
                    </p>
                  )}
                </div>

                <DialogFooter className="pt-2 flex flex-row gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => {
                      reset()
                      setIsOpen(false)
                    }}
                    className="rounded-none font-mono text-xs tracking-wider border-slate-200 text-slate-500 hover:bg-slate-50 h-9 px-4 cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs"
                  >
                    {isSubmitting ? "저장 중..." : "저장"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* 기존 및 추가된 링크 목록 */}
          {isLoading ? (
            <div className="w-full flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : links.length === 0 ? (
            <div className="w-full text-center py-10 font-mono text-xs text-slate-400">
              등록된 링크가 없습니다.
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

        {/* 다크모드 가이드 */}
        <div className="font-mono text-[9px] text-slate-300 tracking-wider mt-4">
          (Press <kbd className="bg-slate-50 px-1 py-0.5 rounded border border-slate-100 text-[8px]">d</kbd> to toggle dark mode)
        </div>

      </div>
    </div>
  )
}
