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
      'Workflow Wizard': "You have a color-coded spreadsheet for everything, including your weekend plans. People fear your pivot tables",
      'Executive Oracle': "You don't take meetings, you take 'alignments.' You haven't made eye contact with a lower-level employee in years",
      'Middle Manager': "You've seen colleagues come and go, but you're still here—steady, reliable, and just coasting at a safe altitude",
      'Engagement Risk': "Your enthusiasm levels are dangerously low. Please see HR for mandatory morale training",
      'The Intern': "You have no idea what's going on, but you're smiling through the panic. Hope you like exposure as payment!"
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
    <div className="container" style={{ overflowY: 'auto', height: 'auto', minHeight: '100vh' }}>
      <div className="background" />
      
      {/* Branding info container */}
      <div className="branding-info">
        {/* Logo and social media text centered */}
        <div className="branding-content">
          {/* Logo */}
          <div className="logo-container">
            <Image 
              src="/SoulSnap_Logo_LIGHT_Yellow.png" 
              alt="SoulSnap Logo" 
              width={150} 
              height={60} 
              priority
            />
          </div>
          
          {/* Social media text */}
          <div className="social-container">
            <div className="social-text">
              <p className="follow-text">DEVELOPED BY</p>
              <p className="handle-text">@CHROMALINK.CO</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="content" style={{ overflowY: 'auto', maxHeight: '100vh', height: '100vh', display: 'block' }}>
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
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow-y: auto !important;
          background: black;
        }
        
        .container {
          width: 100vw;
          min-height: 100vh;
          display: flex;
          align-items: flex-start; /* Changed from center to allow content to start from top */
          justify-content: center;
          background: black;
          position: relative;
          overflow-y: auto !important; /* Force vertical scrolling */
          overflow-x: hidden;
        }
        
        /* Branding info styles */
        .branding-info {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 30px;
          z-index: 10;
        }
        
        .branding-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          width: 100%;
        }
        
        .logo-container {
          display: flex;
          align-items: center;
        }
        
        .social-container {
          display: flex;
          align-items: center;
        }
        
        .social-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .follow-text {
          font-size: 1rem;
          font-family: var(--font-michroma);
          font-weight: 400;
          font-style: normal;
          letter-spacing: 0.05em;
          line-height: 1.5;
          color: #FFE7C8;
          margin: 0;
          padding: 0;
        }
        
        .handle-text {
          font-size: 1rem;
          font-family: var(--font-michroma);
          font-weight: 400;
          font-style: normal;
          letter-spacing: 0.05em;
          line-height: 1.5;
          color: #FFE7C8;
          margin: 0;
          padding: 0;
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
          height: 100vh;
          display: block;
          padding: 2rem;
          padding-bottom: 5rem;
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch; /* For better scrolling on iOS devices */
        }

        .report-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          max-width: 1800px;
          gap: 2rem;
          transform: scale(1);
          transform-origin: center top;
          margin: 2vh auto 5vh auto; /* Center horizontally with auto margins */
          max-height: none; /* Remove any max-height limitation */
          overflow: visible; /* Allow content to be visible */
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
          margin-top: 5%; /* Added to move the reading box down by 5% */
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

        .reading-container::-webkit-scrollbar {
          width: 8px;
        }

        .reading-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .reading-container::-webkit-scrollbar-thumb {
          background: rgba(240, 165, 0, 0.5);
          border-radius: 4px;
        }

        .reading-container::-webkit-scrollbar-thumb:hover {
          background: rgba(240, 165, 0, 0.7);
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
        
        /* Specific 1080x1920 resolution */
        @media screen and (width: 1080px) and (height: 1920px) {
          .section-text {
            font-size: 1.4rem !important; /* Larger font size for 1080x1920 resolution */
          }
          
          .category-description {
            font-size: 1.4rem !important; /* Larger font size for 1080x1920 resolution */
          }
        }
        
        /* More flexible media query for similar resolutions around 712x1150-1192 */
        @media screen and (min-width: 700px) and (max-width: 730px) and (min-height: 1100px) and (max-height: 1200px) {
          .header-section {
            display: flex;
            flex-direction: row !important; /* Force side-by-side layout */
            align-items: center !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            margin-top: 17rem !important; /* Changed from 2rem to 17rem */
            margin-bottom: 1rem !important;
            transform: scale(1.05) !important; /* Make 5% bigger */
            transform-origin: center center !important;
          }
          
          .text-header {
            flex: 1 !important;
            max-width: 50% !important; /* Take up half the width */
            margin-top: 0 !important;
            order: 1 !important; /* Put text on the left */
          }
          
          .image-section {
            flex: 1 !important;
            max-width: 45% !important; /* Take up slightly less than half the width */
            order: 2 !important; /* Put image on the right */
          }
          
          .title-text {
            font-size: min(max(1.3rem, 5vw), 1.5rem) !important; /* Smaller font size for title */
          }
          
          .category-description {
            font-size: 0.9rem !important; /* Smaller font size for description */
            margin-top: 0.5rem !important;
          }
          
          .report-container {
            margin-top: 0 !important; /* Remove top margin */
            padding-top: 1rem !important; /* Add some padding at the top */
          }
          
          .reading-section {
            margin-top: 1rem !important; /* Reduce space before reading section */
          }
          
          .divider-container {
            margin-top: 0 !important; /* Remove top margin from divider */
          }
        }
        
        /* Additional responsive approach using aspect ratio */
        @media screen and (min-width: 690px) and (max-width: 740px) and (min-aspect-ratio: 0.59/1) and (max-aspect-ratio: 0.62/1) {
          .header-section {
            display: flex;
            flex-direction: row !important; /* Force side-by-side layout */
            align-items: center !important;
            justify-content: space-between !important;
            gap: 1rem !important;
            margin-top: 17rem !important; /* Changed from 2rem to 17rem */
            margin-bottom: 1rem !important;
            transform: scale(1.05) !important; /* Make 5% bigger */
            transform-origin: center center !important;
          }
          
          .text-header {
            flex: 1 !important;
            max-width: 50% !important; /* Take up half the width */
            margin-top: 0 !important;
            order: 1 !important; /* Put text on the left */
          }
          
          .image-section {
            flex: 1 !important;
            max-width: 45% !important; /* Take up slightly less than half the width */
            order: 2 !important; /* Put image on the right */
          }
          
          .title-text {
            font-size: min(max(1.3rem, 5vw), 1.5rem) !important; /* Smaller font size for title */
          }
          
          .category-description {
            font-size: 0.9rem !important; /* Smaller font size for description */
            margin-top: 0.5rem !important;
          }
          
          .report-container {
            margin-top: 0 !important; /* Remove top margin */
            padding-top: 1rem !important; /* Add some padding at the top */
          }
          
          .reading-section {
            margin-top: 1rem !important; /* Reduce space before reading section */
          }
          
          .divider-container {
            margin-top: 0 !important; /* Remove top margin from divider */
          }
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
          text-align: left;
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

          .section-text {
            font-size: 1.1rem;
            line-height: 1.6;
          }
        }
        
        @media (min-width: 1025px) {
          .report-container {
            transform: scale(1.15);
            transform-origin: center top;
            margin-top: 10vh;
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
          
          .title-container {
            line-height: 1.3;
          }
        }

        @media (max-width: 768px) {
          .reading-text {
            font-size: 1.72rem;
          }

          .report-container {
            width: 95%;
            padding: 1rem 0;
            margin-top: -8vh !important; /* Move up by 8vh */
          }

          .reading-container {
            padding: 1.5rem;
          }

          h1 {
            font-size: min(max(1.44rem, 4.8vw), 1.76rem); /* 20% smaller than original */
          }

          .highlight {
            font-size: min(max(1.44rem, 4.8vw), 1.76rem); /* 20% smaller than original */
            margin-bottom: 1rem;
          }

          .reading-text {
            font-size: min(max(0.8rem, 3.6vw), 1.04rem); /* 20% smaller than original */
          }

          .section-text {
            font-size: 0.8rem; /* 20% smaller */
            line-height: 1.4;
          }

          .section-label {
            font-size: 0.88rem; /* 20% smaller */
          }

          .download-button {
            font-size: min(max(0.8rem, 3.2vw), 0.96rem); /* 20% smaller than original */
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
            margin-top: 0vh !important; /* Set to 0vh as requested */
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
          
          /* Preserve button styling from larger screens */
          .download-button {
            border-radius: 32.5px !important; /* Same as desktop */
            width: auto !important; /* Override mobile full-width */
            padding: 1.56rem 4.55rem !important; /* Match desktop padding */
            font-size: clamp(1.56rem, 1.6vw, 1.56rem) !important; /* Match desktop font size */
          }
        }
        
        /* Add responsive behavior for different screen sizes */
        @media (max-height: 800px) {
          .report-container {
            transform: scale(0.9);
            margin-top: 5vh;
            gap: 1rem;
          }
          
          .reading-container {
            max-height: 50vh;
          }
        }
        
        @media (max-width: 768px) {
          .header-section {
            flex-direction: column;
            gap: 2rem;
          }
          
          .text-header,
          .image-section {
            max-width: 100%;
          }
          
          .report-container {
            transform: scale(1);
            margin-top: 2vh;
          }
          
          .section {
            flex-direction: column;
          }
          
          .section-label {
            width: 100%;
            margin-bottom: 0.5rem;
          }
        }
        
        /* Mobile-specific fixes */
        @media (max-width: 767px) {
          .container {
            height: auto !important;
            overflow-y: auto !important;
          }
          
          .content {
            height: auto !important;
            min-height: 100vh !important;
            overflow-y: auto !important;
            padding: 1rem;
          }
          
          .report-container {
            transform: scale(0.95);
            margin-top: 1vh;
          }
          
          .reading-container {
            max-height: 70vh;
            overflow-y: auto !important;
          }
          
          .header-section {
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .text-header, .image-section {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
