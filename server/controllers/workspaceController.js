import prisma from "../configs/prisma.js";
import { getAuth } from '@clerk/express';

// Get all workspaces for user
export const getUserWorkspaces = async(req, res) => {
    try{
        const {userId} = getAuth(req);
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {some: {userId}}
            },
            include: {
                members: {include: {user: true}},
                projects: {
                    include: {
                        tasks: {include: {assignee: true, comments: {include: {user: true}}}},
                        members: { include: { user: true }}
                    }
                },
                owner: true

            }
        });
        res.json({workspaces})

    }catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message })

    }
}

// Create workspace
export const createWorkspace = async (req, res) => {
    try {
        const {userId} = getAuth(req);
        const {name, slug, description} = req.body;

        if(!name) {
            return res.status(400).json({message: "Workspace name is required"})
        }

        // Generate slug from name if not provided
        const workspaceSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        // Check if slug already exists
        const existingWorkspace = await prisma.workspace.findUnique({
            where: {slug: workspaceSlug}
        });

        if(existingWorkspace) {
            return res.status(400).json({message: "Workspace with this slug already exists"})
        }

        // Create workspace
        const workspace = await prisma.workspace.create({
            data: {
                id: `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
                name,
                slug: workspaceSlug,
                description: description || "",
                ownerId: userId,
            },
            include: {
                members: {include: {user: true}},
                owner: true,
                projects: []
            }
        });

        // Add creator as ADMIN member
        await prisma.workspaceMember.create({
            data: {
                userId,
                workspaceId: workspace.id,
                role: 'ADMIN'
            }
        });

        // Fetch workspace with all relations
        const createdWorkspace = await prisma.workspace.findUnique({
            where: {id: workspace.id},
            include: {
                members: {include: {user: true}},
                owner: true,
                projects: {
                    include: {
                        tasks: {include: {assignee: true, comments: {include: {user: true}}}},
                        members: { include: { user: true }}
                    }
                }
            }
        });

        res.json({workspace: createdWorkspace, message: "Workspace created successfully"})

    }catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}

// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const {userId} = getAuth(req);
        const {email, role, workspaceId, message} = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({where: {email}});

        if(!user) {
            return res.status(404).json({message: "User not found"})
        }

        if(!workspaceId || !role) {
            return res.status(400).json({message: "Missing required parameters"})
        }

        if(!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({message: "Invalid role"})
        }

        // fetch workspace
        const workspace = await prisma.workspace.findUnique({where: {id:workspaceId}, include: {members: true}})

        if(!workspace) {
            return res.status(404).json({message: "Workspace not found"})
        }

        if (!workspace.members.find((member) =>member.userId === userId && member.role === "ADMIN" )){
            return res.status(401).json({message: "You do not have admin privilages"})
        }
        // Check if user is already a member
        const existingMember = workspace.members.find((member) => member.userId === user.id);

        if(existingMember){
            return res.status(400).json({message: "User is already a member"})
        }

        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        })

        res.json({member, message: "Member added successfully"})


    }catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
}
