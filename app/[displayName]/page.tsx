"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import { notFound } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { collection, query, getDocs, where, orderBy } from "firebase/firestore"
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth"
import { db, auth, googleProvider } from "@/lib/firebase"
import { Header } from "@/components/header"
import { Card } from "@/components/ui/card"
import { IconLoader2 as Loader2, IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"

interface LinkItem {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ displayName: string }>;
}

export default function PublicProfilePage({ params }: PageProps) {
  const { displayName } = use(params)
  const decodedDisplayName = decodeURIComponent(displayName)
  const queryClient = useQueryClient()

  // 방문자의 Firebase Auth 로그인 상태 관리
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setIsAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error("구글 로그인 에러: ", err)
      toast.error("구글 로그인에 실패했습니다.")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      queryClient.clear()
    } catch (err) {
      console.error("로그아웃 에러: ", err)
      toast.error("로그아웃에 실패했습니다.")
    }
  }

  // 1. displayName으로 유저 프로필 조회 Query
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useQuery({
    queryKey: ["publicProfile", decodedDisplayName],
    queryFn: async () => {
      const q = query(collection(db, "users"), where("displayName", "==", decodedDisplayName))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        return null
      }
      const userDoc = querySnapshot.docs[0]
      const data = userDoc.data()
      
      // username이 없으면 404 처리 대상이 됨
      if (!data.username) {
        return null
      }

      return {
        uid: userDoc.id,
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || "한 줄 소개가 없습니다.",
        photoURL: data.photoURL || "",
      }
    },
  })

  const profileUid = profile?.uid

  // 2. 해당 유저의 공개 링크 목록 조회 Query
  const { data: links = [], isLoading: isLinksLoading } = useQuery({
    queryKey: ["publicLinks", profileUid],
    queryFn: async () => {
      if (!profileUid) return []
      const q = query(collection(db, "users", profileUid, "links"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        url: doc.data().url,
        faviconUrl: doc.data().faviconUrl,
        createdAt: doc.data().createdAt,
      })) as LinkItem[]
    },
    enabled: !!profileUid,
  })

  // 로딩 상태 처리
  if (isProfileLoading || isAuthLoading) {
    return (
      <div className="min-h-svh w-full bg-[#FAFBFB] flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
          <span className="text-[10px] text-slate-400 tracking-widest uppercase">페이지 불러오는 중...</span>
        </div>
      </div>
    )
  }

  // 유저가 존재하지 않거나 username이 없는 경우 404 페이지 노출
  if (isProfileError || !profile) {
    notFound()
  }

  return (
    <div className="min-h-svh w-full bg-[#FAFBFB] flex flex-col items-center justify-start overflow-x-hidden font-mono">
      {/* 헤더 추가 (방문자가 로그인 하거나 작성자 본인이 자신의 페이지를 볼 때 헤더 활용) */}
      <Header user={currentUser} onSignIn={handleSignIn} onSignOut={handleSignOut} />

      <div className="w-full max-w-md flex flex-col items-center gap-10 px-4 py-16 flex-1 justify-start">
        {/* 프로필 정보 영역 */}
        <div className="relative flex flex-col items-center text-center gap-2 w-full mt-4 animate-fade-in select-none">
          {/* 프로필 이미지 */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border border-slate-200/80 shadow-xs mb-3 bg-slate-100 shrink-0">
            {profile.photoURL ? (
              <Image
                src={profile.photoURL}
                alt={profile.username}
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cyan-50 text-cyan-600 font-mono text-xl font-bold">
                {profile.username.charAt(0)}
              </div>
            )}
          </div>

          {/* 이름 (username) */}
          <div className="relative flex items-center justify-center min-h-[32px] w-full">
            <h1 className="text-xl font-bold tracking-wider text-slate-800 font-sans">
              {profile.username}
            </h1>
          </div>

          {/* 디스플레이 닉네임 (displayName) */}
          <div className="relative flex items-center justify-center min-h-[24px] w-full">
            <p className="text-xs text-slate-400 font-mono tracking-wider">
              @{profile.displayName}
            </p>
          </div>

          {/* 한 줄 소개 (bio) */}
          <div className="relative flex items-center justify-center min-h-[28px] mt-2 w-full px-8">
            <p className="text-[11px] text-slate-500 font-mono leading-relaxed tracking-wider whitespace-pre-line text-center">
              {profile.bio}
            </p>
          </div>
        </div>

        {/* 링크 카드 리스트 (읽기 전용) */}
        <div className="w-full flex flex-col gap-4 animate-fade-in">
          {isLinksLoading ? (
            <div className="w-full flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : links.length === 0 ? (
            <div className="w-full text-center py-12 border border-dashed border-slate-200/80 bg-white/30 text-slate-400 font-mono text-xs tracking-wider">
              등록된 링크가 없습니다.
            </div>
          ) : (
            links.map((link) => (
              <Card key={link.id} className="relative hover:border-slate-300 bg-white transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] border-slate-200/80 rounded-none overflow-hidden w-full">
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
                </div>
              </Card>
            ))
          )}
        </div>

        {/* 비로그인 방문자를 위한 메인 시작 화면 돌아가기 버튼 */}
        {!currentUser && (
          <div className="w-full flex justify-center mt-2 animate-fade-in">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-sans text-xs font-semibold tracking-wide transition-all duration-150 shadow-2xs hover:shadow-xs cursor-pointer select-none no-underline decoration-none"
            >
              <IconArrowLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>시작 화면으로 돌아가기</span>
            </a>
          </div>
        )}

        {/* 하단 카피라이트 */}
        <footer className="w-full text-center pt-16 pb-4 text-[10px] text-slate-400 font-sans tracking-widest select-none">
          © 2026 MyLink. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
