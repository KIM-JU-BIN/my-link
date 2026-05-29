"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { dummyUser, dummyLinks, type LinkItem } from "@/data/links"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, writeBatch, doc, addDoc } from "firebase/firestore"
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
import { IconPlus } from "@tabler/icons-react"
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

export default function Page() {
  const [links, setLinks] = useState<LinkItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const isMigratingRef = useRef(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      title: "",
      url: "",
    },
  })

  useEffect(() => {
    const q = query(collection(db, "users", "anonymous", "links"), orderBy("createdAt", "asc"))
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !isMigratingRef.current) {
        isMigratingRef.current = true
        try {
          const batch = writeBatch(db)
          dummyLinks.forEach((link) => {
            const docRef = doc(db, "users", "anonymous", "links", link.id)
            batch.set(docRef, {
              title: link.title,
              url: link.url,
              faviconUrl: link.faviconUrl,
              createdAt: link.createdAt,
            })
          })
          await batch.commit()
        } catch (err) {
          console.error("초기 마이그레이션 실패: ", err)
          isMigratingRef.current = false
        }
      } else {
        const fetchedLinks = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          url: doc.data().url,
          faviconUrl: doc.data().faviconUrl,
          createdAt: doc.data().createdAt,
        })) as LinkItem[]
        setLinks(fetchedLinks)
        setIsLoading(false)
      }
    }, (error) => {
      console.error("onSnapshot 에러: ", error)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const onSubmit = async (data: LinkFormValues) => {
    let domain = ""
    try {
      const urlObj = new URL(data.url)
      domain = urlObj.hostname
    } catch (err) {
      domain = data.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0]
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

    const newLink = {
      title: data.title,
      url: data.url,
      faviconUrl,
      createdAt: new Date().toISOString(),
    }

    try {
      await addDoc(collection(db, "users", "anonymous", "links"), newLink)
      reset()
      setIsOpen(false)
    } catch (err) {
      console.error("링크 저장 실패: ", err)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      reset()
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
              <Button className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-slate-900 rounded-none font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-0 shadow-xs">
                <IconPlus className="w-4 h-4" />
                새 링크 추가
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
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                    제목
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="예: 내 기술 블로그"
                    {...register("title")}
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
                    className="rounded-none bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs tracking-wider h-9 px-4 cursor-pointer border-0 shadow-xs"
                  >
                    저장
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* 기존 및 추가된 링크 목록 */}
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div 
                key={idx} 
                className="w-full h-[72px] bg-slate-100/50 border border-slate-100 rounded-none animate-pulse flex items-center px-6 relative"
              >
                <div className="absolute left-6 w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                <div className="h-4 bg-slate-200 rounded-xs w-28 mx-auto" />
              </div>
            ))
          ) : links.length === 0 ? (
            <div className="w-full text-center py-10 font-mono text-xs text-slate-400">
              등록된 링크가 없습니다.
            </div>
          ) : (
            links.map((link) => (
              <Link 
                key={link.id} 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group w-full"
              >
                <Card className="relative hover:border-slate-300 bg-white transition-all duration-200 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-slate-200/80 rounded-none overflow-hidden w-full">
                  <CardHeader className="flex flex-row items-center justify-center py-5 px-6 relative min-h-[72px]">
                    
                    {/* 좌측 고정 파비콘 이미지 */}
                    <div className="absolute left-6 w-8 h-8 rounded-full overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
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
                    
                    {/* 중앙 정렬 텍스트 */}
                    <CardTitle className="text-sm font-semibold tracking-wider font-mono text-slate-700 group-hover:text-[#1A26EE] transition-colors duration-150 text-center">
                      {link.title}
                    </CardTitle>

                  </CardHeader>
                </Card>
              </Link>
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
