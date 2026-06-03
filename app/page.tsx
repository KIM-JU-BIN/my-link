"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { db, auth, googleProvider } from "@/lib/firebase"
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc } from "firebase/firestore"
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { Header } from "@/components/header"

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
import { IconPlus, IconLoader2 as Loader2, IconPencil, IconTrash, IconBrandGoogle } from "@tabler/icons-react"
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
              className="rounded-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs flex items-center justify-center gap-1.5"
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
          
          <span className="text-sm font-semibold tracking-wider font-mono text-slate-700 hover:text-cyan-600 transition-colors duration-150 text-left break-all line-clamp-2 pr-2">
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
                  "<span className="font-bold text-slate-700">{link.title}</span>" 링크를 삭제합니다.
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

export default function Page() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{
    username: string;
    displayName: string;
    bio: string;
    photoURL: string;
  } | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
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

  // Firebase Auth 상태 리스너 등록 및 프로필 정보 Firestore 동기화
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid)
          const userSnap = await getDoc(userDocRef)
          const nickname = currentUser.email ? currentUser.email.split("@")[0] : "user"

          let profileData = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: nickname,
            username: currentUser.displayName || "사용자",
            photoURL: currentUser.photoURL || "",
            bio: "한 줄 소개를 입력해주세요.",
            lastLoginAt: new Date().toISOString(),
          }

          if (userSnap.exists()) {
            const existData = userSnap.data()
            profileData = {
              ...profileData,
              displayName: existData.displayName || nickname,
              username: existData.username || currentUser.displayName || "사용자",
              photoURL: existData.photoURL || currentUser.photoURL || "",
              bio: existData.bio || "한 줄 소개를 입력해주세요.",
            }
          }

          await setDoc(userDocRef, profileData, { merge: true })

          setProfile({
            username: profileData.username,
            displayName: profileData.displayName,
            bio: profileData.bio,
            photoURL: profileData.photoURL,
          })
        } catch (err) {
          console.error("유저 프로필 정보 Firestore 동기화 실패: ", err)
        }
      } else {
        setProfile(null)
      }
      setUser(currentUser)
      setIsAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error("구글 소셜 로그인 에러: ", err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      setLinks([])
    } catch (err) {
      console.error("로그아웃 에러: ", err)
    }
  }

  const fetchLinks = async (uid: string) => {
    setIsLoading(true)
    try {
      const q = query(collection(db, "users", uid, "links"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const fetchedLinks = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        url: doc.data().url,
        faviconUrl: doc.data().faviconUrl,
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt || undefined,
      })) as LinkItem[]
      setLinks(fetchedLinks)
    } catch (error) {
      console.error("링크 로드 에러: ", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchLinks(user.uid)
    } else {
      setLinks([])
      setIsLoading(false)
    }
  }, [user])

  const handleAddLink = async (data: LinkFormValues) => {
    if (!user) return
    setIsSubmitting(true)
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
      const docRef = await addDoc(collection(db, "users", user.uid, "links"), newLinkData)
      const newLinkItem: LinkItem = {
        id: docRef.id,
        ...newLinkData,
      }
      setLinks((prev) => [newLinkItem, ...prev])
      setIsOpen(false)
      reset()
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
    if (!user) return
    try {
      const linkRef = doc(db, "users", user.uid, "links", id)
      const updatedAt = new Date().toISOString()
      await updateDoc(linkRef, {
        title,
        url,
        faviconUrl,
        updatedAt,
      })
      setLinks((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title, url, faviconUrl, updatedAt } : item))
      )
    } catch (err) {
      console.error("링크 수정 실패: ", err)
      throw err
    }
  }

  const handleDeleteLink = async (id: string) => {
    if (!user) return
    try {
      const linkRef = doc(db, "users", user.uid, "links", id)
      await deleteDoc(linkRef)
      setLinks((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      console.error("링크 삭제 실패: ", err)
      throw err
    }
  }

  return (
    <div className="min-h-svh w-full bg-[#FAFBFB] flex flex-col items-center justify-start overflow-x-hidden font-mono">
      <Header user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />

      <div className={`w-full ${user ? "max-w-md" : "max-w-2xl"} flex flex-col items-center gap-10 px-4 py-16 flex-1 justify-center`}>
        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            <span className="text-[10px] text-slate-400 tracking-widest uppercase">인증 데이터 불러오는 중...</span>
          </div>
        ) : !user ? (
          <div className="w-full flex flex-col items-center py-4 animate-fade-in">
            {/* 타이틀: Development in One Link. */}
            <h1 className="text-center font-sans font-extrabold tracking-tight text-slate-900 leading-none select-none">
              <span className="block text-4xl sm:text-[54px] mb-2 sm:mb-4">Development in</span>
              <span className="block text-5xl sm:text-[68px] text-cyan-600">One Link.</span>
            </h1>

            {/* 서브 타이틀 */}
            <p className="text-center text-slate-500 font-sans font-medium text-xs sm:text-sm tracking-wide mt-6 leading-relaxed max-w-sm sm:max-w-md select-none">
              GitHub, 블로그, 포트폴리오까지.<br />
              개발자를 위한 모든 링크를 한 페이지에 담아보세요.
            </p>

            {/* Google로 시작하기 버튼 */}
            <Button
              onClick={handleSignIn}
              className="h-12 bg-cyan-600 hover:bg-cyan-500 text-white rounded-none font-sans text-xs font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer border-0 shadow-[0_4px_14px_rgba(8,145,178,0.25)] transition-all duration-300 w-full max-w-xs mt-8 sm:mt-10"
            >
              <IconBrandGoogle className="w-4 h-4" />
              <span>Google로 시작하기</span>
            </Button>

            {/* 플로팅 카드 일러스트 */}
            <div className="relative w-full max-w-sm mt-12 sm:mt-16 flex justify-center">
              <div className="w-64 sm:w-72 bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] animate-float relative overflow-hidden select-none">
                {/* 프로필 정보 영역 */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="w-16 h-3 bg-slate-100 rounded-xs"></div>
                    <div className="w-24 h-2 bg-slate-50/80 rounded-xs"></div>
                  </div>
                </div>

                {/* 링크 아이템 1 (청록색 활성화 형태) */}
                <div className="w-full h-11 rounded-lg bg-cyan-50/50 border border-cyan-100/50 flex items-center px-3 gap-3 mb-2.5 relative">
                  <div className="w-6 h-6 rounded-full bg-cyan-600/10 shrink-0 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-600"></div>
                  </div>
                  <div className="w-24 h-2 bg-cyan-600/20 rounded-xs"></div>
                  
                  {/* 마우스 포인터 아이콘 */}
                  <div className="absolute right-6 bottom-[-14px] z-10 text-slate-800 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-[-15deg]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2v15.5l3.5-3.5 2.5 5.5 2-1-2.5-5.5 4.5-.5z"/>
                    </svg>
                  </div>
                </div>

                {/* 링크 아이템 2 (일반 회색 형태) */}
                <div className="w-full h-11 rounded-lg bg-slate-50 border border-slate-100 flex items-center px-3 gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0"></div>
                  <div className="w-28 h-2 bg-slate-200 rounded-xs"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 프로필 섹션 */}
            <div className="flex flex-col items-center text-center gap-2 w-full mt-4 animate-fade-in">
              {/* 프로필 이미지 */}
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
              
              {/* 이름 (구글 본명) */}
              <h1 className="text-xl font-bold tracking-wider text-slate-800 font-sans">
                {profile?.username || user.displayName || "사용자"}
              </h1>
              {/* 닉네임 (구글 이메일 앞글자) */}
              <p className="text-xs text-slate-400 font-mono tracking-wider">
                @{profile?.displayName || user.email?.split("@")[0] || "user"}
              </p>
              {/* 한 줄 소개 */}
              <p className="text-[11px] text-slate-500 font-mono leading-relaxed tracking-wider max-w-[280px] mt-2 whitespace-pre-line">
                {profile?.bio || "한 줄 소개를 입력해주세요."}
              </p>
            </div>

            <div className="w-full flex flex-col gap-4 animate-fade-in">
              {/* 링크 추가 다이얼로그 */}
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
                        className="rounded-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs flex items-center justify-center gap-1.5"
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
                <div className="w-full text-center py-12 border border-dashed border-slate-200/80 bg-white/30 text-slate-400 font-mono text-xs tracking-wider">
                  아직 등록된 링크가 없어요.
                  <span className="block mt-1 text-[10px] text-slate-300">첫 번째 링크를 추가해 링크 허브를 완성하세요!</span>
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
          </>
        )}
      </div>
    </div>
  )
}

