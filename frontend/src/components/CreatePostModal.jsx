import React, { useState } from 'react';
import { Sparkles, Film, X, Image } from 'lucide-react';
import { postAPI, aiAPI } from '../services/api';

function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateCaption = async () => {
    if (!content) return;
    setAiLoading(true);
    try {
      const response = await aiAPI.generateCaption({ context: content });
      if (response.data.success) {
        setContent(response.data.data.caption);
      }
    } catch (error) {
      console.error('Failed to generate caption:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!content) return;
    setAiLoading(true);
    try {
      const response = await aiAPI.generateHashtags({ content });
      if (response.data.success) {
        setHashtags(response.data.data.hashtags);
      }
    } catch (error) {
      console.error('Failed to generate hashtags:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content) return;
    setLoading(true);
    try {
      await postAPI.create({ content, mediaUrl: null, mediaType: 'text', hashtags });
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <button onClick={onClose}><X className="w-6 h-6 text-gray-600" /></button>
          <h2 className="font-semibold">Create Post</h2>
          <button onClick={handleSubmit} disabled={loading || !content} className="text-purple-600 font-semibold disabled:opacity-50">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 resize-none focus:outline-none text-gray-800"
          />

          <div className="flex items-center space-x-3">
            <button onClick={handleGenerateCaption} disabled={aiLoading || !content} className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm disabled:opacity-50">
              <Sparkles className="w-4 h-4" />
              <span>{aiLoading ? 'Generating...' : 'AI Caption'}</span>
            </button>

            <button onClick={handleGenerateHashtags} disabled={aiLoading || !content} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm disabled:opacity-50">
              <Sparkles className="w-4 h-4" />
              <span>AI Hashtags</span>
            </button>
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span key={index} className="text-purple-600 text-sm font-medium">{tag}</span>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Add photo or video</p>
            <input type="file" accept="image/*,video/*" className="text-sm" />
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <p className="text-sm text-gray-600">Tap to add a title for your live stream...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePostModal;