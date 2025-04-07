'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/session'
import Image from 'next/image'

export default function MainReport() {
  const router = useRouter()
  const aiResponse = useSessionStore((state) => state.aiResponse)
  const aiName = useSessionStore((state) => state.aiName)
  const aiModelImage = useSessionStore((state) => state.aiModelImage)
  const aiCategory = useSessionStore((state) => state.aiModelProvider)

  console.log('Main Report - Category:', aiCategory) // Debug log

  // Format category name for display
  const formatCategoryName = (category: string | null) => {
    if (!category) return 'Mystery Person';
    
    // Replace underscores with spaces and capitalize each word
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  const getCategoryDescription = (category: string): string => {
    const descriptions: Record<string, string> = {
      'Synergy Specialist': "You call every meeting a 'touch base' and genuinely believe in the power of icebreakers",
      'Corporate Climber': "You've mastered the art of taking credit for other people's work while looking like a team player",
      'Buzzword Enthusiast': "You can't complete a sentence without saying 'synergy', 'disrupt', or 'leverage'",
      'Office Politician': "You've built a career on knowing exactly whose coffee to fetch",
      'Email Samurai': "You wield the CC field like a weapon and your signature includes an inspirational quote",
      'Culture Ambassador': "You organize office parties that everyone secretly dreads attending",
      'LinkedIn Influencer': "Your profile says 'Thought Leader' but your thoughts are mostly recycled motivational quotes",
      'Jargon Juggernaut': "You don't solve problems, you 'ideate scalable solutions for pain points'",
      'Meeting Marathoner': "You could have sent an email, but instead you scheduled a pre-meeting for the meeting",
      'Feedback Fiend': "You begin every criticism with 'I'm just playing devil's advocate here'"
    };
    return descriptions[category] || "You have no idea what's going on, but you're smiling through the panic. Hope you like exposure as payment!";
  };

  // Function to split the AI response into sections
  const splitResponseIntoSections = (response: string): Record<string, string> => {
    const sections: Record<string, string> = {
      'General Impression': '',
      'HR Memo': '',
      'Final Verdict': ''
    };

    // Try to extract sections based on common patterns in the AI response
    const generalImpressionMatch = response.match(/(?:General Impression|Overall Assessment|First Impression)[:\s]+(.*?)(?=\n\n|HR Memo|VR Memo|Final Verdict|$)/i);
    const hrMemoMatch = response.match(/(?:HR Memo|VR Memo|Virtual Reality Notes|VR Assessment)[:\s]+(.*?)(?=\n\n|Final Verdict|General Impression|$)/i);
    const finalVerdictMatch = response.match(/(?:Final Verdict|Conclusion|Final Assessment)[:\s]+(.*?)(?=\n\n|General Impression|HR Memo|VR Memo|$)/i);

    // Update sections with extracted content if found, removing any section headers from the content
    if (generalImpressionMatch && generalImpressionMatch[1]) {
      // Remove any section headers from the content
      let content = generalImpressionMatch[1].trim();
      content = content.replace(/^(General Impression|Overall Assessment|First Impression)[:\s]+/i, '');
      sections['General Impression'] = content;
    } else {
      // If no specific section found, use the first third of the text
      const lines = response.split('\n').filter(line => line.trim() !== '');
      const firstThird = Math.ceil(lines.length / 3);
      let content = lines.slice(0, firstThird).join('\n').trim();
      content = content.replace(/^(General Impression|Overall Assessment|First Impression)[:\s]+/i, '');
      sections['General Impression'] = content;
    }

    if (hrMemoMatch && hrMemoMatch[1]) {
      // Remove any section headers from the content
      let content = hrMemoMatch[1].trim();
      content = content.replace(/^(HR Memo|VR Memo|Virtual Reality Notes|VR Assessment)[:\s]+/i, '');
      sections['HR Memo'] = content;
    } else {
      // If no specific section found, use the middle third of the text
      const lines = response.split('\n').filter(line => line.trim() !== '');
      const firstThird = Math.ceil(lines.length / 3);
      const secondThird = firstThird * 2;
      let content = lines.slice(firstThird, secondThird).join('\n').trim();
      content = content.replace(/^(HR Memo|VR Memo|Virtual Reality Notes|VR Assessment)[:\s]+/i, '');
      sections['HR Memo'] = content;
    }

    if (finalVerdictMatch && finalVerdictMatch[1]) {
      // Remove any section headers from the content
      let content = finalVerdictMatch[1].trim();
      content = content.replace(/^(Final Verdict|Conclusion|Final Assessment)[:\s]+/i, '');
      sections['Final Verdict'] = content;
    } else {
      // If no specific section found, use the last third of the text
      const lines = response.split('\n').filter(line => line.trim() !== '');
      const secondThird = Math.ceil(lines.length / 3) * 2;
      let content = lines.slice(secondThird).join('\n').trim();
      content = content.replace(/^(Final Verdict|Conclusion|Final Assessment)[:\s]+/i, '');
      sections['Final Verdict'] = content;
    }

    return sections;
  };

  useEffect(() => {
    if (!aiModelImage || !aiResponse) {
      router.push('/page1-home')
    }
  }, [aiModelImage, aiResponse, router])

  const handleDownload = () => {
    router.push('/page5-email')
  }

  if (!aiModelImage || !aiResponse) {
    return null
  }

  const sections = splitResponseIntoSections(aiResponse);

  return (
    <div className="container">
      <div className="background" />
      
      <div className="content">
        <div className="report-container">
          <div className="header-section">
            <div className="text-header">
              <div className="title-container">
                <h2 className="title-text highlight">You are being reassigned to... {formatCategoryName(aiCategory)}</h2>
              </div>
              <p className="category-description">{getCategoryDescription(formatCategoryName(aiCategory))}</p>
            </div>
            <div className="image-section">
              <div className="image-container">
                <Image
                  src={aiModelImage}
                  alt="AI Generated Portrait"
                  width={800}
                  height={800}
                  className="result-image"
                  priority
                />
              </div>
            </div>
          </div>
          
          <div className="divider-container">
            <div className="divider-line"></div>
            <div className="divider-line"></div>
          </div>
          
          <div className="reading-section">
            <div className="reading-container">
              <div className="sections-container">
                {Object.entries(sections).map(([section, text]) => (
                  <div key={section} className="section">
                    <div className="section-label">{section}</div>
                    <div className="section-text-container">
                      <p className="section-text">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="button-area">
            <button onClick={handleDownload} className="download-button">
              DOWNLOAD
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .container {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          position: relative;
          overflow: hidden;
        }

        .background {
          position: fixed;
          inset: 0;
          background-image: url('/grid_2.jpg');
          background-position: center;
          background-size: cover;
          opacity: 0.8;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2rem;
          gap: 2rem;
        }

        .report-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 1800px;
          gap: 2rem;
          transform: scale(1.1);
          transform-origin: center top;
          margin-top: 10vh;
        }

        .header-section {
          display: flex;
          width: 100%;
          max-width: 1800px;
          gap: 4rem;
          align-items: flex-start;
          justify-content: space-between;
          margin-top: 2rem;
        }

        .text-header {
          flex: 1;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-top: 2%;
        }

        .image-section {
          flex: 1;
          max-width: 500px;
        }

        .image-container {
          width: 100%;
          aspect-ratio: 1;
          position: relative;
          border-radius: 2.5rem;
          overflow: hidden;
          box-shadow: 
            0 0 30px rgba(255, 255, 255, 0.2),
            0 0 60px rgba(255, 255, 255, 0.1),
            0 0 90px rgba(255, 255, 255, 0.05);
        }

        .result-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .reading-section {
          width: 100%;
          max-width: 1800px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
        }

        .divider-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .divider-line {
          width: 100%;
          height: 1px;
          background-color: #F0A500;
        }

        .reading-container {
          width: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 1.5rem;
          padding: 2rem;
          overflow-y: auto;
          max-height: 60vh;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
        }

        .sections-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section {
          display: flex;
          margin-bottom: 1rem;
          color: white;
          line-height: 1.4;
          text-align: left;
        }

        .section-label {
          font-family: var(--font-b612-mono);
          font-weight: 700;
          font-size: 1.1rem;
          color: #F0A500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          width: 180px;
          padding-right: 1rem;
          text-shadow: 0 0 20px rgba(240, 165, 0, 0.4),
                    0 0 40px rgba(240, 165, 0, 0.3),
                    0 0 60px rgba(240, 165, 0, 0.2);
          text-align: left;
        }

        .section-text-container {
          flex: 1;
          text-align: left;
        }

        .section-text {
          margin: 0;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: 1.1rem;
          font-weight: 400;
          line-height: 1.6;
          white-space: pre-line;
          text-align: left;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2rem;
        }

        .title-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0;
          margin-bottom: initial; /* Reset to default */
        }

        .title-text {
          font-family: var(--font-michroma);
          color: #FFE7C8;
          font-size: 2.5rem;
          letter-spacing: 0.05em;
          margin: 0;
          padding: 0;
          text-align: left;
          margin-bottom: initial; /* Reset to default */
          padding-bottom: initial; /* Reset to default */
        }

        .title-text.highlight {
          color: #F0A500;
          text-shadow: 0 0 8px rgba(255, 165, 0, 0.4), 0 0 16px rgba(255, 140, 0, 0.3), 0 0 24px rgba(255, 120, 0, 0.2);
          margin-top: 0;
        }

        .reading-text {
          font-family: var(--font-b612-mono);
          font-size: 1.72rem;
          font-weight: 400;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          text-align: left;
          letter-spacing: 0.02em;
          white-space: pre-line;
          margin: 0;
          background: transparent;
        }

        .category-description {
          margin: 0;
          transform: translateY(35%); /* Reset to original */
          margin-top: 0.2rem; /* Increased from 0.1rem for a bit more space */
          color: #FFC578;
          font-size: 1.3rem;
          font-weight: 400;
          text-align: center;
          font-family: var(--font-b612-mono);
        }

        .button-area {
          width: 100%;
          display: flex;
          justify-content: center;
          margin-top: 1vh;
        }

        .download-button {
          background: transparent;
          border: 2px solid #FFE7C8;
          color: #FFE7C8;
          font-family: var(--font-b612-mono);
          font-size: clamp(1.95rem, 1.95vw, 1.56rem);
          font-weight: 400;
          letter-spacing: 0.05em;
          padding: 1.56rem 4.55rem;
          border-radius: 32.5px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 0 5px rgba(255, 231, 200, 0.5),
            0 0 10px rgba(255, 231, 200, 0.3),
            0 0 15px rgba(255, 231, 200, 0.2);
        }

        .download-button:hover {
          background: rgba(255, 231, 200, 0.1);
          box-shadow: 
            0 0 10px rgba(255, 231, 200, 0.6),
            0 0 20px rgba(255, 231, 200, 0.4),
            0 0 30px rgba(255, 231, 200, 0.2);
          transform: scale(1.02);
        }

        .download-button:active {
          transform: scale(0.98);
        }

        @media (max-width: 1024px) {
          .reading-text {
            font-size: 1.72rem;
          }

          .report-container {
            width: 90%;
            padding: 2rem 0;
            margin-top: 5vh;
            gap: 0; /* Set gap to 0 for tablets */
          }

          .button-area {
            margin-top: 3vh; /* Move button down by 3% of viewport height */
          }

          .header-section {
            display: flex;
            width: 100%;
            max-width: 1800px;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            margin-top: 2rem;
            transform-origin: center top;
            transform: scale(0.8);
            margin-bottom: -2rem;
          }

          .text-header {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0; /* Remove gap completely */
            margin-top: 2%;
            align-items: flex-start;
            text-align: left;
            max-width: 60%;
          }

          .title-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;
            margin-bottom: 0; /* No margin */
          }

          .title-text {
            text-align: left !important;
            font-size: 2rem;
            margin-bottom: 0; /* No margin */
            padding-bottom: 0; /* No padding */
          }

          .category-description {
            text-align: left;
            margin: 0;
            transform: none; /* Remove transform */
            margin-top: 0.2rem; /* Increased from 0.1rem for a bit more space */
          }

          .image-section {
            transform-origin: center top;
            transform: scale(1.056); /* Increased by another 20% from 0.88 */
            max-width: 40%;
          }
          
          /* Preserve the section layout from desktop */
          .section {
            display: flex;
            width: 100%;
            gap: 2rem;
            margin-bottom: 2rem;
          }

          .section-label {
            width: 30%;
            font-weight: 700;
            color: #FFC578;
            padding-right: 1rem;
            font-family: var(--font-b612-mono);
            font-size: 1.1rem;
          }

          .section-text-container {
            width: 70%;
          }

          .divider-container {
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 3rem;
          }
        }
        
        @media (min-width: 1025px) {
          .category-description {
            transform: translateY(10%);
          }

          .report-container {
            width: 90%;
            max-width: 1200px;
            padding: 3rem 0;
          }
        }

        @media (max-width: 768px) {
          .reading-text {
            font-size: 1.72rem;
          }

          .report-container {
            width: 95%;
            padding: 1rem 0;
          }

          .reading-container {
            padding: 1.5rem;
          }

          h1 {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
          }

          .highlight {
            font-size: min(max(1.8rem, 6vw), 2.2rem);
            margin-bottom: 1rem;
          }

          .reading-text {
            font-size: min(max(1rem, 4.5vw), 1.3rem);
          }

          .download-button {
            font-size: min(max(1rem, 4vw), 1.2rem);
            padding: min(max(0.8rem, 1.5vh), 1.2rem) min(max(2rem, 4vw), 3rem);
            border-width: 2px;
            width: 100%;
          }
        }

        /* iPad Pro (12.9-inch) */
        @media (min-width: 1024px) and (max-width: 1366px) {
          .category-description {
            margin-top: 0.5rem; /* More gap for iPad Pro */
          }
        }
        
        /* iPad Air (10.9-inch) */
        @media (min-width: 820px) and (max-width: 1023px) {
          .report-container {
            margin-top: -5vh; /* Move up by 10% (5vh up from the default) */
          }
          
          .category-description {
            margin-top: 0.4rem; /* More gap for iPad Air */
          }
          
          .reading-container {
            transform: scale(0.9);
            transform-origin: center top;
            margin-bottom: -2rem;
            width: 100%;
          }
          
          .section {
            display: flex;
            width: 100%;
            gap: 1.8rem;
            margin-bottom: 1.8rem;
          }
          
          .section-label {
            width: 30%;
            font-size: 0.99rem;
          }

          .section-text {
            font-size: 0.99rem;
            line-height: 1.5;
          }
        }
        
        /* iPad Mini (8.3-inch) */
        @media (min-width: 768px) and (max-width: 819px) {
          .report-container {
            margin-top: -5vh; /* Move up by 10% (5vh up from the default) */
          }
          
          .reading-container {
            transform: scale(0.9);
            transform-origin: center top;
            margin-bottom: -2rem;
            width: 100%;
          }
          
          .section {
            display: flex;
            width: 100%;
            gap: 1.8rem;
            margin-bottom: 1.8rem;
          }
          
          .section-label {
            width: 30%;
            font-size: 0.99rem;
          }

          .section-text {
            font-size: 0.99rem;
            line-height: 1.5;
          }
        }
      `}</style>
    </div>
  )
}
