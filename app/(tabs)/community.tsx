import CommunityPost from '@/components/community/CommunityPost';
import { useTheme } from '@/contexts/ThemeContext';
import CommunityService, { CommunityPost as PostType } from '@/lib/communityService';
import SupabaseService from '@/lib/supabase-service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const EMOJIS = ['😀', '😁', '😂', '🤣', '😊', '😍', '🤩', '🤔', '👏', '👍', '🙏', '🔥', '🌟', '🚀', '✅', '❗'];

export default function CommunityScreen() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [composer, setComposer] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<PostType | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const bg = useMemo(() => ({ backgroundColor: isDark ? '#0b1220' : '#ffffff' }), [isDark]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const list = await CommunityService.getCommunityFeed(0, 20);
      setPosts(list);
    } finally {
      setLoading(false);
    }
  };

  const pickImages = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) {
      const uris = (res.assets || []).map(a => a.uri).slice(0, 4);
      setImages(prev => [...prev, ...uris].slice(0, 4));
    }
  };

  const addEmoji = (e: string) => setComposer(prev => prev + e);

  const sendPost = async () => {
    if (!composer.trim() && images.length === 0) return;
    setSending(true);
    try {
      // Upload images to Supabase Storage first, then post URLs
      const uploadedUrls = images.length > 0
        ? await SupabaseService.uploadMultipleCommunityImages(images)
        : [];
      const created = await CommunityService.createCommunityPost(composer.trim(), uploadedUrls);
      if (created) {
        setComposer('');
        setImages([]);
        setPosts(prev => [created, ...prev]);
      }
    } finally {
      setSending(false);
    }
  };

  const onVote = (postId: string, type: 'upvote' | 'downvote') => {
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      user_vote: type,
      vote_counts: {
        upvotes: (p.vote_counts?.upvotes || 0) + (type === 'upvote' ? 1 : 0) - (p.user_vote === 'upvote' ? 1 : 0),
        downvotes: (p.vote_counts?.downvotes || 0) + (type === 'downvote' ? 1 : 0) - (p.user_vote === 'downvote' ? 1 : 0)
      }
    } : p));
  };

  const renderComposer = () => (
    <View style={{ padding: 12, borderTopWidth: 1, borderColor: isDark ? '#1f2a44' : '#e5e7eb' }}>
      <TextInput
        placeholder="Share a thought… (emojis supported)"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        value={composer}
        onChangeText={setComposer}
        multiline
        style={{ minHeight: 48, maxHeight: 120, color: isDark ? '#ffffff' : '#111827' }}
      />
      {images.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {images.map((uri, idx) => (
            <View key={idx} style={{ marginRight: 8, marginBottom: 8, position: 'relative' }}>
              <Image source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
              <Pressable onPress={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#111827aa', borderRadius: 12, padding: 4 }}>
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <ScrollEmojis onPick={addEmoji} isDark={isDark} />
        <TouchableOpacity onPress={pickImages} style={{ marginLeft: 8, padding: 8 }}>
          <Ionicons name="image-outline" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={sendPost} disabled={sending} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, opacity: sending ? 0.6 : 1 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>{sending ? 'Posting…' : 'Post'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[{ flex: 1 }, bg]}>
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <FlatList
            style={{ flex: 1 }}
            data={posts}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <CommunityPost post={item} onReply={setReplyTo} onVote={onVote} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
            refreshing={loading}
            onRefresh={loadFeed}
          />
          {renderComposer()}
        </>
      )}

      {/* Reply modal */}
      <Modal visible={!!replyTo} transparent animationType="slide" onRequestClose={() => setReplyTo(null)}>
        <View style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? '#0b1220' : '#ffffff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12 }}>
            {replyTo && <CommunityPost post={replyTo} showReplies />}
            {replyTo && <RepliesList postId={replyTo.id} isDark={isDark} />}
            {/* Keeping replies simple: reuse composer and call createCommunityPost with parent_post_id */}
            <ReplyComposer parent={replyTo} onClose={() => setReplyTo(null)} isDark={isDark} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ScrollEmojis({ onPick, isDark }: { onPick: (e: string) => void; isDark: boolean }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={EMOJIS}
      keyExtractor={(e) => e}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onPick(item)} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          <Text style={{ fontSize: 18 }}>{item}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function ReplyComposer({ parent, onClose, isDark }: { parent: PostType | null; onClose: () => void; isDark: boolean }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (!parent || !text.trim()) return;
    setSending(true);
    try {
      await CommunityService.createCommunityPost(text.trim(), undefined, parent.issue_id, parent.id);
      onClose();
    } finally { setSending(false); }
  };
  return (
    <View style={{ paddingTop: 8 }}>
      <TextInput
        placeholder="Write a reply…"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        value={text}
        onChangeText={setText}
        multiline
        style={{ minHeight: 48, color: isDark ? '#ffffff' : '#111827' }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
        <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }}>
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={send} disabled={sending} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, opacity: sending ? 0.6 : 1 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>{sending ? 'Replying…' : 'Reply'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function RepliesList({ postId, isDark }: { postId: string; isDark: boolean }) {
  const [replies, setReplies] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const list = await CommunityService.getPostReplies(postId);
        setReplies(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  if (loading) return null;
  if (replies.length === 0) return null;

  return (
    <View style={{ marginTop: 8 }}>
      {replies.map((r) => (
        <View key={r.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: isDark ? '#1f2a44' : '#e5e7eb' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="person-circle-outline" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={{ marginLeft: 6, color: isDark ? '#ffffff' : '#111827', fontWeight: '600' }}>
              {r.user_profile?.display_name || 'Anonymous'}
            </Text>
            {!!r.user_profile?.role && (
              <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: isDark ? '#111827' : '#eef2ff' }}>
                <Text style={{ fontSize: 10, color: isDark ? '#93c5fd' : '#3b82f6', fontWeight: '700' }}>
                  {r.user_profile.role === 'officer' ? 'Officer' : 'Citizen'}
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: isDark ? '#ffffff' : '#111827' }}>{r.content}</Text>
          {!!r.image_urls && r.image_urls.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
              {r.image_urls.map((u, idx) => (
                <Image key={idx} source={{ uri: u }} style={{ width: 72, height: 72, borderRadius: 8, marginRight: 6, marginBottom: 6 }} />
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
